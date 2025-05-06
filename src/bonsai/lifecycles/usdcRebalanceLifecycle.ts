import { SubaccountClient } from '@dydxprotocol/v4-client-js';

import { TransactionMemo } from '@/constants/analytics';
import { timeUnits } from '@/constants/time';
import { WalletNetworkType } from '@/constants/wallets';

import type { RootStore } from '@/state/_store';
import { selectShouldAccountRebalanceUsdc } from '@/state/accountSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { createAppSelector } from '@/state/appTypes';

import { sleep } from '@/lib/timeUtils';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import {
  selectTxAuthorizedAccount,
  selectUserHasUsdcGasForTransaction,
} from '../selectors/accountTransaction';

// Sleep time between rebalances to ensure that the subaccount has time to process the previous transaction
const SLEEP_TIME = timeUnits.second * 10;
const INVALIDATION_SLEEP_TIME = timeUnits.second * 10;

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function setUpUsdcRebalanceLifecycle(store: RootStore) {
  const balanceAndTransfersSelector = createAppSelector(
    [
      selectTxAuthorizedAccount,
      selectUserHasUsdcGasForTransaction,
      selectShouldAccountRebalanceUsdc,
    ],
    (txAuthorizedAccount, userHasUsdcGasForTransaction, rebalanceAction) => {
      if (!txAuthorizedAccount) {
        return undefined;
      }

      const { localDydxWallet, sourceAccount, parentSubaccountInfo } = txAuthorizedAccount;

      return {
        localDydxWallet,
        parentSubaccountInfo,
        sourceAccount,
        userHasUsdcGasForTransaction,
        rebalanceAction,
      };
    }
  );

  const activeRebalance = createSemaphore();

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector: balanceAndTransfersSelector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null || !data.userHasUsdcGasForTransaction) {
        return undefined;
      }

      async function rebalanceWalletFunds() {
        const { localDydxWallet, parentSubaccountInfo, sourceAccount, rebalanceAction } = data!;

        // context: Cosmos wallets do not support our lifecycle methods and are instead handled within useNotificationTypes
        if (rebalanceAction == null || sourceAccount.chain === WalletNetworkType.Cosmos) {
          return;
        }

        if (rebalanceAction.requiredAction === 'deposit') {
          const { amountToDeposit, usdcBalance, targetAmount } = rebalanceAction;

          logBonsaiInfo(
            'usdcRebalanceLifecycle',
            `depositing excess USDC into parent subaccount ${parentSubaccountInfo.subaccount}`,
            {
              subaccountNumber: parentSubaccountInfo.subaccount,
              balance: usdcBalance,
              amountToDeposit,
              targetAmount,
            }
          );

          const subaccountClient = new SubaccountClient(
            localDydxWallet!,
            parentSubaccountInfo.subaccount
          );

          try {
            await compositeClient.depositToSubaccount(
              subaccountClient,
              amountToDeposit,
              TransactionMemo.depositToSubaccount
            );
          } finally {
            await sleep(SLEEP_TIME);

            appQueryClient.invalidateQueries({
              queryKey: ['validator', 'accountBalances'],
              exact: false,
            });

            await sleep(INVALIDATION_SLEEP_TIME);
          }
        }

        if (rebalanceAction.requiredAction === 'withdraw') {
          const { amountToWithdraw, fromSubaccountNumber, usdcBalance, targetAmount } =
            rebalanceAction;

          const subaccountClient = new SubaccountClient(localDydxWallet!, fromSubaccountNumber);

          logBonsaiInfo(
            'usdcRebalanceLifecycle',
            `withdrawing funds from subaccount (${fromSubaccountNumber}) for gas reserve`,
            {
              balance: usdcBalance,
              amountToWithdraw,
              targetAmount,
              subaccountNumber: fromSubaccountNumber,
            }
          );

          try {
            await compositeClient.withdrawFromSubaccount(
              subaccountClient,
              amountToWithdraw,
              undefined,
              TransactionMemo.withdrawFromSubaccount
            );
          } finally {
            await sleep(SLEEP_TIME);

            appQueryClient.invalidateQueries({
              queryKey: ['validator', 'accountBalances'],
              exact: false,
            });

            await sleep(INVALIDATION_SLEEP_TIME);
          }
        }
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
