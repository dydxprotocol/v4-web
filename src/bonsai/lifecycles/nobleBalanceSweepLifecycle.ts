import { GAS_MULTIPLIER, LocalWallet, NobleClient } from '@dydxprotocol/v4-client-js';
import { CosmosTx, SkipClient, Tx } from '@skip-go/client';
import { parseUnits } from 'viem';

import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import { MIN_USDC_AMOUNT_FOR_AUTO_SWEEP } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';
import { WalletNetworkType } from '@/constants/wallets';
import { isNobleIbcMsg } from '@/types/skip';

import type { RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { createAppSelector } from '@/state/appTypes';
import { selectHasNonExpiredPendingWithdraws } from '@/state/transfersSelectors';

import { MaybeBigNumber } from '@/lib/numbers';
import { sleep } from '@/lib/timeUtils';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createNobleTransactionStoreEffect } from '../rest/lib/nobleTransactionStoreEffect';

function isCosmosTx(tx: Tx): tx is { cosmosTx: CosmosTx; operationsIndices: number[] } {
  return 'cosmosTx' in tx;
}

// 0.1 USDC buffer to account for IBC fees
const USDC_IBC_FEE_BUFFER = 0.1;

// Sleep time between sweeps to ensure that the subaccount has time to process the previous transaction. IBC transactions should not exceed 1 minute unless network is congested/degraded.
const SLEEP_TIME = timeUnits.second * 30;
const INVALIDATION_SLEEP_TIME = timeUnits.second * 10;

/**
 * @description Lifecycle for sweeping all USDC on Noble to dYdX chain. This is used to sweep deposits that only land within Noble.
 */
export function setUpNobleBalanceSweepLifecycle(store: RootStore) {
  const accountAndBalanceSelector = createAppSelector(
    [BonsaiCore.account.nobleUsdcBalance.data, selectHasNonExpiredPendingWithdraws],
    (balance, hasNonExpiredPendingWithdraws) => {
      return {
        balance,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  let nobleSigningClient: NobleClient | undefined;
  let storedNobleClientRpcUrl: string | undefined;
  let storedNobleLocalWallet: LocalWallet | undefined;
  const skipClient = new SkipClient();

  const activeSweep = createSemaphore();

  const noopCleanupEffect = createNobleTransactionStoreEffect(store, {
    selector: accountAndBalanceSelector,
    handle: (
      { nobleClientRpcUrl, tokenConfig, chainId },
      { dydxAddress, nobleLocalWallet, sourceAccount },
      { balance, hasNonExpiredPendingWithdraws }
    ) => {
      async function sweepNobleBalance() {
        const balanceBN = MaybeBigNumber(balance);
        if (
          balance == null ||
          balanceBN == null ||
          balanceBN.lte(MIN_USDC_AMOUNT_FOR_AUTO_SWEEP + USDC_IBC_FEE_BUFFER)
        ) {
          return;
        }

        if (nobleLocalWallet.address == null || dydxAddress == null) {
          return;
        }

        if (hasNonExpiredPendingWithdraws) {
          return;
        }

        // Set up Noble and Skip clients
        if (nobleSigningClient == null || storedNobleClientRpcUrl !== nobleClientRpcUrl) {
          nobleSigningClient = new NobleClient(nobleClientRpcUrl);
          storedNobleClientRpcUrl = nobleClientRpcUrl;
        }

        // No need to reconnect if the nobleLocalWallet is the same as the stored one
        if (storedNobleLocalWallet !== nobleLocalWallet) {
          await nobleSigningClient.connect(nobleLocalWallet);
          storedNobleLocalWallet = nobleLocalWallet;
        }

        // Get MsgDirectResponse and construct ibc message
        const balanceToSweep = balanceBN.minus(MIN_USDC_AMOUNT_FOR_AUTO_SWEEP).toString();
        const amountIn = parseUnits(balanceToSweep, tokenConfig.usdc.decimals).toString();

        const msgDirectResponse = await skipClient.msgsDirect({
          sourceAssetDenom: 'uusdc',
          sourceAssetChainID: 'noble-1',
          destAssetDenom: tokenConfig.usdc.denom,
          destAssetChainID: chainId,
          chainIdsToAddresses: {
            [chainId]: dydxAddress,
            'noble-1': nobleLocalWallet.address,
          },
          amountIn,
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
            balance,
            fee,
            amount: parsedMsg.token.amount,
            feeAdjustedAmount,
          }
        );

        await nobleSigningClient.send(
          [ibcMsg],
          undefined,
          `${DEFAULT_TRANSACTION_MEMO} | ${nobleLocalWallet.address}`
        );

        await sleep(SLEEP_TIME);

        appQueryClient.invalidateQueries({
          queryKey: ['validator', 'accountBalances'],
          exact: false,
        });

        appQueryClient.invalidateQueries({
          queryKey: ['nobleClient', 'nobleBalances'],
          exact: false,
        });

        await sleep(INVALIDATION_SLEEP_TIME);
      }

      // Don't auto-sweep on Cosmos
      // TODO: Add notification to prompt user to sweep manually
      if (sourceAccount.chain === WalletNetworkType.Cosmos) {
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
    noopCleanupEffect();
    activeSweep.clear();
    storedNobleLocalWallet = undefined;
    nobleSigningClient = undefined;
    storedNobleClientRpcUrl = undefined;
  };
}
