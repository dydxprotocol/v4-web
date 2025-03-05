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
import { createChainTransactionStoreEffect } from '../rest/lib/chainTransactionStoreEffect';

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function setUpUsdcRebalanceLifecycle(store: RootStore) {
  const balanceAndTransfersSelector = createAppSelector(
    [BonsaiCore.account.balances.data, selectHasNonExpiredPendingWithdraws],
    (balances, hasNonExpiredPendingWithdraws) => {
      return {
        balances,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  let transferInProgress = false;
  const activeRebalance = createSemaphore();

  function setTransferInProgress(value: boolean) {
    transferInProgress = value;
  }

  function getTransferInProgress() {
    return transferInProgress;
  }

  const cleanupEffect = createChainTransactionStoreEffect(store, {
    selector: balanceAndTransfersSelector,
    onResultUpdate: (compositeClient, { subaccountClient, sourceAccount }, data) => {
      async function rebalanceWalletFunds() {
        const isTransferInProgress = getTransferInProgress();
        if (isTransferInProgress) return;

        const { balances, hasNonExpiredPendingWithdraws } = data;
        const usdcBalance = balances.usdcAmount;
        const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

        if (usdcBalanceBN != null && usdcBalanceBN.gte(0)) {
          const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
          const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

          try {
            setTransferInProgress(true);

            if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
              const amountToDeposit = usdcBalanceBN
                .minus(AMOUNT_RESERVED_FOR_GAS_USDC)
                .toFixed(USDC_DECIMALS);

              logBonsaiInfo('usdcRebalanceLifecycle', 'depositing funds to subaccount', {
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
          } finally {
            setTransferInProgress(false);
          }
        }
      }

      // Don't auto-rebalance on Cosmos
      // TODO: Add notification to prompt user to rebalance manually
      if (sourceAccount.chain === WalletNetworkType.Cosmos) {
        logBonsaiInfo('usdcRebalanceLifecycle', 'skipping rebalance, user has native wallet');
        return;
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
    },
  });

  return () => {
    cleanupEffect();
    setTransferInProgress(false);
  };
}
