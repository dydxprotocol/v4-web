import { keyBy } from 'lodash';

import { timeUnits } from '@/constants/time';
import { WalletNetworkType } from '@/constants/wallets';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { accountTransactionManager, type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { sleep } from '@/lib/timeUtils';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectParentSubaccountOpenPositions } from '../selectors/account';
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
      selectParentSubaccountOpenPositions,
    ],
    (txAuthorizedAccount, orders, positions) => {
      if (!txAuthorizedAccount || orders.length === 0) {
        return undefined;
      }

      const groupedPositions = keyBy(positions, (o) => o.uniqueId);

      const filteredOrders = orders.filter((o) => {
        const isConditionalOrder = o.orderFlags === OrderFlags.CONDITIONAL;
        const isReduceOnly = o.reduceOnly;
        const isActiveOrder = o.status === OrderStatus.Open || o.status === OrderStatus.Untriggered;
        return isConditionalOrder && isReduceOnly && isActiveOrder;
      });

      // Add orders to cancel if they are orphaned, or if the reduce-only order would increase the position
      const ordersToCancel = filteredOrders.filter((o) => {
        const position = groupedPositions[o.positionUniqueId];
        const isOrphan = position == null;
        const hasInvalidReduceOnlyOrder =
          (position?.side === IndexerPositionSide.LONG && o.side === IndexerOrderSide.BUY) ||
          (position?.side === IndexerPositionSide.SHORT && o.side === IndexerOrderSide.SELL);

        return isOrphan || hasInvalidReduceOnlyOrder;
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

  const activeOrderCancellations = createSemaphore();

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null || !data.localDydxWallet) {
        return undefined;
      }

      async function cancelTriggerOrdersWithClosedOrFlippedPositions() {
        const { ordersToCancel } = data!;
        await Promise.all(
          ordersToCancel.map((o) =>
            accountTransactionManager.cancelOrder({
              orderId: o.id,
              withNotification: false,
            })
          )
        );
        await sleep(SLEEP_TIME);
      }

      if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
        return undefined;
      }

      activeOrderCancellations
        .run(() => cancelTriggerOrdersWithClosedOrFlippedPositions())
        .catch((error) => {
          if (error instanceof SupersededError) {
            return;
          }

          logBonsaiError(
            'cancelOrphanedTriggerOrdersLifecycle',
            'Failed to cancel trigger orders',
            {
              error,
            }
          );
        });

      return undefined;
    },
    handleNoClient: undefined,
  });

  return () => {
    activeOrderCancellations.clear();
    noopCleanupEffect();
  };
}
