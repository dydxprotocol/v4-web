import { SubaccountClient } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { TransactionMemo } from '@/constants/analytics';
import { CosmosWalletNotificationTypes } from '@/constants/notifications';
import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import type { RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { createAppSelector } from '@/state/appTypes';
import { addCosmosWalletNotification, removeCosmosWalletNotification } from '@/state/notifications';
import { getCosmosWalletNotifications } from '@/state/notificationsSelectors';
import { selectHasNonExpiredPendingWithdraws } from '@/state/transfersSelectors';

import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { sleep } from '@/lib/timeUtils';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
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
      BonsaiCore.account.balances.data,
      BonsaiCore.account.childSubaccountSummaries.data,
      selectHasNonExpiredPendingWithdraws,
      selectUserHasUsdcGasForTransaction,
    ],
    (
      txAuthorizedAccount,
      balances,
      childSubaccountSummaries,
      hasNonExpiredPendingWithdraws,
      userHasUsdcGasForTransaction
    ) => {
      if (!txAuthorizedAccount || childSubaccountSummaries == null) {
        return undefined;
      }

      const { localDydxWallet, sourceAccount, parentSubaccountInfo } = txAuthorizedAccount;

      return {
        localDydxWallet,
        parentSubaccountInfo,
        sourceAccount,
        balances,
        childSubaccountSummaries,
        hasNonExpiredPendingWithdraws,
        userHasUsdcGasForTransaction,
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
        const {
          localDydxWallet,
          balances,
          childSubaccountSummaries,
          hasNonExpiredPendingWithdraws,
          parentSubaccountInfo,
          sourceAccount,
        } = data!;
        const usdcBalance = balances.usdcAmount;
        const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);
        const state = store.getState();
        const gasRebalanceNotification =
          getCosmosWalletNotifications(state)[CosmosWalletNotificationTypes.GasRebalance];

        if (usdcBalanceBN != null && usdcBalanceBN.gte(0)) {
          const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
          const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

          if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
            if (sourceAccount.chain === WalletNetworkType.Cosmos) {
              return;
            }

            const amountToDeposit = usdcBalanceBN
              .minus(AMOUNT_RESERVED_FOR_GAS_USDC)
              .toFixed(USDC_DECIMALS);

            logBonsaiInfo(
              'usdcRebalanceLifecycle',
              `depositing excess USDC into parent subaccount ${parentSubaccountInfo.subaccount}`,
              {
                subaccountNumber: parentSubaccountInfo.subaccount,
                balance: usdcBalance,
                amountToDeposit,
                targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
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
          } else if (shouldWithdraw) {
            const amountToWithdraw = MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC)
              .minus(usdcBalanceBN)
              .toFixed(USDC_DECIMALS);

            const maybeSubaccountNumber = objectEntries(childSubaccountSummaries).find(
              ([_, summary]) => {
                if (summary.freeCollateral.gt(amountToWithdraw)) {
                  return true;
                }

                return false;
              }
            )?.[0];

            if (maybeSubaccountNumber == null) {
              return;
            }

            const subaccountNumber = Number(maybeSubaccountNumber);
            const subaccountClient = new SubaccountClient(localDydxWallet!, subaccountNumber);

            if (sourceAccount.chain === WalletNetworkType.Cosmos) {
              if (gasRebalanceNotification) return;

              logBonsaiInfo('usdcRebalanceLifecycle', `cosmos: add gas rebalance notification`, {
                balance: usdcBalance,
                amountToWithdraw,
                targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
                subaccountNumber,
              });

              store.dispatch(
                addCosmosWalletNotification(CosmosWalletNotificationTypes.GasRebalance)
              );

              return;
            }

            logBonsaiInfo(
              'usdcRebalanceLifecycle',
              `withdrawing funds from subaccount (${subaccountNumber}) for gas reserve`,
              {
                balance: usdcBalance,
                amountToWithdraw,
                targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
                subaccountNumber,
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
          } else {
            if (sourceAccount.chain === WalletNetworkType.Cosmos) {
              if (!gasRebalanceNotification) return;
              logBonsaiInfo('usdcRebalanceLifecycle', `cosmos: remove gas rebalance notification`);

              store.dispatch(
                removeCosmosWalletNotification(CosmosWalletNotificationTypes.GasRebalance)
              );
            }
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
