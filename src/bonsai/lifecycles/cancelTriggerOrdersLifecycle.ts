import { timeUnits } from '@/constants/time';
import { WalletNetworkType } from '@/constants/wallets';

import { type RootStore } from '@/state/_store';
import { selectOrphanedTriggerOrders } from '@/state/accountSelectors';
import { createAppSelector } from '@/state/appTypes';

import { runFn } from '@/lib/do';
import { TimeEjectingSet } from '@/lib/timeEjectingSet';
import { isPresent } from '@/lib/typeUtils';

import { accountTransactionManager } from '../AccountTransactionSupervisor';
import { isOperationFailure } from '../lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectTxAuthorizedCloseOnlyAccount } from '../selectors/accountTransaction';

// Sleep time between cancelling trigger orders to ensure that the subaccount has time to process the previous cancels
const SLEEP_TIME = timeUnits.second * 10;

/**
 * @description This lifecycle is used to cancel trigger orders when a position is closed or side is flipped.
 */
export function setUpCancelOrphanedTriggerOrdersLifecycle(store: RootStore) {
  const selector = createAppSelector(
    [selectTxAuthorizedCloseOnlyAccount, selectOrphanedTriggerOrders],
    (txAuthorizedAccount, orphanedTriggerOrders) => {
      if (!txAuthorizedAccount || orphanedTriggerOrders == null) {
        return undefined;
      }

      const { localDydxWallet, sourceAccount, parentSubaccountInfo } = txAuthorizedAccount;

      return {
        localDydxWallet,
        sourceAccount,
        parentSubaccountInfo,
        ordersToCancel: orphanedTriggerOrders,
      };
    }
  );

  const cancelingOrderIds = new TimeEjectingSet(timeUnits.minute);

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null || !data.localDydxWallet) {
        return undefined;
      }

      runFn(async () => {
        try {
          const { ordersToCancel: ordersToCancelRaw } = data;
          const ordersToCancel = ordersToCancelRaw.filter((o) => !cancelingOrderIds.has(o.id));

          // context: Cosmos wallets do not support our lifecycle methods and are instead handled within useNotificationTypes
          if (
            ordersToCancel.length === 0 ||
            data.sourceAccount.chain === WalletNetworkType.Cosmos
          ) {
            return undefined;
          }

          logBonsaiInfo(
            'cancelTriggerOrdersWithClosedOrFlippedPositions',
            `Cancelling ${ordersToCancel.length} trigger orders`,
            {
              ordersToCancel,
            }
          );

          const results = await Promise.all(
            ordersToCancel.map(async (o) => {
              // acquire a lock on this id for 60 seconds
              cancelingOrderIds.add(o.id);
              const result = await accountTransactionManager.cancelOrder({
                orderId: o.id,
                withNotification: false,
              });
              // set lock to 10 more seconds
              cancelingOrderIds.add(o.id, SLEEP_TIME);
              return result;
            })
          );

          const failed = results
            .map((r, idx) => {
              if (isOperationFailure(r)) {
                return {
                  ...ordersToCancel[idx],
                  error: r.errorString,
                };
              }
              return null;
            })
            .filter(isPresent);

          if (failed.length > 0) {
            logBonsaiError(
              'cancelTriggerOrdersWithClosedOrFlippedPositions',
              `Failed to cancel ${failed.length}/${ordersToCancel.length} trigger orders`,
              {
                failedOperations: failed,
              }
            );
          }
        } catch (error) {
          logBonsaiError('cancelOrphanedTriggerOrdersLifecycle', 'lifecycle error', {
            error,
          });
        }
        return undefined;
      });

      return undefined;
    },
    handleNoClient: undefined,
  });

  return () => {
    noopCleanupEffect();
  };
}
