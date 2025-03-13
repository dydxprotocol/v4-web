import BigNumber from 'bignumber.js';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { TransactionMemo } from '@/constants/analytics';
import { USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { selectHasNonExpiredPendingWithdraws } from '@/state/transfersSelectors';

import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectTxAuthorizedAccount } from '../selectors/accountTransaction';

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function setUpUsdcRebalanceLifecycle(store: RootStore) {
  const balanceAndTransfersSelector = createAppSelector(
    [
      selectTxAuthorizedAccount,
      BonsaiCore.account.balances.data,
      selectHasNonExpiredPendingWithdraws,
    ],
    (txAuthorizedAccount, balances, hasNonExpiredPendingWithdraws) => {
      if (!txAuthorizedAccount) {
        return undefined;
      }

      const { subaccountClient, sourceAccount } = txAuthorizedAccount;

      return {
        subaccountClient,
        sourceAccount,
        balances,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  const activeRebalance = createSemaphore();

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector: balanceAndTransfersSelector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null) {
        return undefined;
      }

      async function rebalanceWalletFunds() {
        const { subaccountClient, balances, hasNonExpiredPendingWithdraws } = data!;
        const usdcBalance = balances.usdcAmount;
        const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

        if (usdcBalanceBN != null && usdcBalanceBN.gte(0)) {
          const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
          const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

          if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
            const amountToDeposit = usdcBalanceBN
              .minus(AMOUNT_RESERVED_FOR_GAS_USDC)
              .toFixed(USDC_DECIMALS);

            logBonsaiInfo('usdcRebalanceLifecycle', 'depositing excess USDC into subaccount 0', {
              amountToDeposit,
              targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
            });

            await compositeClient.depositToSubaccount(
              subaccountClient,
              amountToDeposit,
              TransactionMemo.depositToSubaccount
            );
          } else if (shouldWithdraw) {
            const amountToWithdraw = MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC)
              .minus(usdcBalanceBN)
              .toFixed(USDC_DECIMALS);

            logBonsaiInfo('usdcRebalanceLifecycle', 'withdrawing funds for gas', {
              amountToWithdraw,
              targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
            });

            await compositeClient.withdrawFromSubaccount(
              subaccountClient,
              amountToWithdraw,
              undefined,
              TransactionMemo.withdrawFromSubaccount
            );
          }
        }
      }

      // Don't auto-rebalance on Cosmos
      // TODO: Add notification to prompt user to rebalance manually
      if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
        return undefined;
      }

      activeRebalance
        .run(() => rebalanceWalletFunds())
        .catch((error) => {
          if (error instanceof SupersededError) {
            return;
          }

          logBonsaiError('usdcRebalanceLifecycle', 'error trying to rebalanceWalletFunds', {
            error,
          });
        });

      return undefined;
    },
    handleNoClient: undefined,
  });

  return () => {
    noopCleanupEffect();
    activeRebalance.clear();
  };
}
