import { GAS_MULTIPLIER, NobleClient } from '@dydxprotocol/v4-client-js';
import { CosmosTx, SkipClient, Tx } from '@skip-go/client';
import { parseUnits } from 'viem';

import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import { MIN_USDC_AMOUNT_FOR_AUTO_SWEEP } from '@/constants/numbers';
import { WalletNetworkType } from '@/constants/wallets';
import { isNobleIbcMsg } from '@/types/indexer/skip';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { selectHasNonExpiredPendingWithdraws } from '@/state/transfersSelectors';

import { MaybeBigNumber } from '@/lib/numbers';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createNobleTransactionStoreEffect } from '../rest/lib/nobleTransactionStoreEffect';
import { selectParentSubaccountInfo } from '../socketSelectors';

function isCosmosTx(tx: Tx): tx is { cosmosTx: CosmosTx; operationsIndices: number[] } {
  return 'cosmosTx' in tx;
}

/**
 * @description Lifecycle for sweeping all USDC on Noble to dYdX chain. This is used to sweep deposits that only land within Noble.
 */
export function setUpNobleBalanceSweepLifecycle(store: RootStore) {
  const accountAndBalanceSelector = createAppSelector(
    [
      selectParentSubaccountInfo,
      BonsaiCore.account.nobleUsdcBalance.data,
      selectHasNonExpiredPendingWithdraws,
    ],
    (parentSubaccountInfo, balance, hasNonExpiredPendingWithdraws) => {
      return {
        parentSubaccountInfo,
        balance,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  let nobleSigningClient: NobleClient | undefined;
  const activeSweep = createSemaphore();

  const cleanupEffect = createNobleTransactionStoreEffect(store, {
    selector: accountAndBalanceSelector,
    onResultUpdate: (
      { nobleClientRpcUrl, tokenConfig, chainId },
      wallet,
      { parentSubaccountInfo, balance, hasNonExpiredPendingWithdraws }
    ) => {
      async function sweepNobleBalance() {
        const balanceBN = MaybeBigNumber(balance);
        if (balance == null || balanceBN == null || balanceBN.lte(MIN_USDC_AMOUNT_FOR_AUTO_SWEEP)) {
          return;
        }

        if (wallet.nobleLocalWallet.address == null || parentSubaccountInfo.wallet == null) {
          return;
        }

        if (hasNonExpiredPendingWithdraws) {
          logBonsaiInfo('nobleBalanceSweepLifecycle', 'skipping sweep, user has pending withdraws');
          return;
        }

        // Set up Noble and Skip clients
        nobleSigningClient = new NobleClient(nobleClientRpcUrl);
        await nobleSigningClient.connect(wallet.nobleLocalWallet);
        const skipClient = new SkipClient();

        // Get MsgDirectResponse and construct ibc message
        const balanceToSweep = balanceBN.minus(MIN_USDC_AMOUNT_FOR_AUTO_SWEEP).toString();
        const msgDirectResponse = await skipClient.msgsDirect({
          sourceAssetDenom: 'uusdc',
          sourceAssetChainID: 'noble-1',
          destAssetDenom: tokenConfig.usdc.denom,
          destAssetChainID: chainId,
          chainIdsToAddresses: {
            [chainId]: parentSubaccountInfo.wallet,
            'noble-1': wallet.nobleLocalWallet.address,
          },
          amountIn: parseUnits(balanceToSweep, tokenConfig.usdc.decimals).toString(),
          slippageTolerancePercent: '1',
        });

        const msgDirectTx = msgDirectResponse.txs.at(0);
        const cosmosTx = msgDirectTx && isCosmosTx(msgDirectTx) ? msgDirectTx.cosmosTx : null;
        const msg = cosmosTx?.msgs.at(0);

        if (msg == null) {
          throw new Error(`No msg found in msgDirectResponse: ${JSON.stringify(msgDirectTx)}`);
        }

        const parsedMsg = isNobleIbcMsg(JSON.parse(msg.msg));

        const ibcMsg = {
          typeUrl: msg.msgTypeURL, // '/ibc.applications.transfer.v1.MsgTransfer'
          value: {
            ...parsedMsg,
            sourceChannel: parsedMsg.source_channel,
            sourcePort: parsedMsg.source_port,
            timeoutHeight: parsedMsg.timeout_height,
            timeoutTimestamp: parsedMsg.timeout_timestamp,
          },
        };

        logBonsaiInfo('nobleBalanceSweepLifecycle', 'simulate sweep USDC from Noble to dYdX', {
          balance,
          balanceToSweep: balanceToSweep.toString(),
        });

        // Simulate transaction to get fee
        const fee = await nobleSigningClient.simulateTransaction([ibcMsg]);

        const feeAdjustedAmount =
          parseInt(ibcMsg.value.token.amount, 10) -
          Math.floor(parseInt(fee.amount[0]!.amount, 10) * GAS_MULTIPLIER);

        ibcMsg.value.token.amount = feeAdjustedAmount.toString();

        if (feeAdjustedAmount <= 0) {
          throw new Error(
            `fee to ibc send is greater than amount to be transferred. amount: ${parsedMsg.token.amount} fee: ${JSON.stringify(fee)}, feeAdjustedAmount: ${feeAdjustedAmount}`
          );
        }

        logBonsaiInfo(
          'nobleBalanceSweepLifecycle',
          'send transaction to sweep USDC from Noble to dYdX',
          {
            fee,
            amount: parsedMsg.token.amount,
            feeAdjustedAmount,
          }
        );

        await nobleSigningClient.send(
          [ibcMsg],
          undefined,
          `${DEFAULT_TRANSACTION_MEMO} | ${wallet.nobleLocalWallet.address}`
        );
      }

      // Don't auto-sweep on Cosmos
      // TODO: Add notification to prompt user to sweep manually
      if (wallet.sourceAccount.chain === WalletNetworkType.Cosmos) {
        logBonsaiInfo('nobleBalanceSweepLifecycle', 'skipping sweep on Cosmos');
        return;
      }

      activeSweep
        .run(() => sweepNobleBalance())
        .catch((error) => {
          if (error instanceof SupersededError) {
            return;
          }

          logBonsaiError(
            'nobleBalanceSweepLifecycle',
            'error sweeping noble balance to dYdX address',
            {
              error,
            }
          );
        });
    },
  });

  return () => {
    cleanupEffect();
  };
}
