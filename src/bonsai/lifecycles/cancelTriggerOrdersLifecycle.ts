import { keyBy } from 'lodash';

import { timeUnits } from '@/constants/time';
import { WalletNetworkType } from '@/constants/wallets';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { calc, runFn } from '@/lib/do';
import { TimeEjectingSet } from '@/lib/timeEjectingSet';
import { isPresent } from '@/lib/typeUtils';

import { accountTransactionManager } from '../AccountTransactionSupervisor';
import { isOperationFailure } from '../lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectTxAuthorizedAccount } from '../selectors/accountTransaction';
import { OrderFlags, OrderStatus } from '../types/summaryTypes';

// Sleep time between cancelling trigger orders to ensure that the subaccount has time to process the previous cancels
const SLEEP_TIME = timeUnits.second * 10;

/**
 * @description This lifecycle is used to cancel trigger orders when a position is closed or side is flipped.
 */
export function setUpCancelOrphanedTriggerOrdersLifecycle(store: RootStore) {
  const selector = createAppSelector(
    [
      selectTxAuthorizedAccount,
      BonsaiCore.account.openOrders.data,
      BonsaiCore.account.parentSubaccountPositions.data,
      BonsaiCore.account.openOrders.loading,
      BonsaiCore.account.parentSubaccountPositions.loading,
    ],
    (txAuthorizedAccount, orders, positions, ordersLoading, positionsLoading) => {
      if (!txAuthorizedAccount || orders.length === 0) {
        return undefined;
      }

      const ordersToCancel = calc(() => {
        if (ordersLoading !== 'success' || positionsLoading !== 'success') {
          return [];
        }
        const groupedPositions = keyBy(positions, (o) => o.uniqueId);

        const filteredOrders = orders.filter((o) => {
          const isConditionalOrder = o.orderFlags === OrderFlags.CONDITIONAL;
          const isReduceOnly = o.reduceOnly;
          const isActiveOrder =
            o.status === OrderStatus.Open || o.status === OrderStatus.Untriggered;
          return isConditionalOrder && isReduceOnly && isActiveOrder;
        });

        // Add orders to cancel if they are orphaned, or if the reduce-only order would increase the position
        const cancelOrders = filteredOrders.filter((o) => {
          const position = groupedPositions[o.positionUniqueId];
          const isOrphan = position == null;
          const hasInvalidReduceOnlyOrder =
            (position?.side === IndexerPositionSide.LONG &&
              o.side === IndexerOrderSide.BUY &&
              o.reduceOnly) ||
            (position?.side === IndexerPositionSide.SHORT &&
              o.side === IndexerOrderSide.SELL &&
              o.reduceOnly);

          return isOrphan || hasInvalidReduceOnlyOrder;
        });

        return cancelOrders;
      });

      const { localDydxWallet, sourceAccount, parentSubaccountInfo } = txAuthorizedAccount;

      return {
        localDydxWallet,
        sourceAccount,
        parentSubaccountInfo,
        ordersToCancel,
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

      if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
        return undefined;
      }

      runFn(async () => {
        try {
          const { ordersToCancel: ordersToCancelRaw } = data;

          const ordersToCancel = ordersToCancelRaw.filter((o) => !cancelingOrderIds.has(o.id));
          if (ordersToCancel.length === 0) {
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
