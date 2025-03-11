import { SubaccountClient } from '@dydxprotocol/v4-client-js';
import { groupBy } from 'lodash';

import { WalletNetworkType } from '@/constants/wallets';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectParentSubaccountOpenPositions } from '../selectors/account';
import { selectTxAuthorizedAccount } from '../selectors/accountTransaction';
import { OrderFlags, OrderStatus, SubaccountOrder } from '../types/summaryTypes';

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
    (authorizedAccount, orders, positions) => {
      if (!authorizedAccount || orders.length === 0) {
        return undefined;
      }

      const groupedPositions = groupBy(positions, 'uniqueId');
      const ordersToCancel: Set<SubaccountOrder> = new Set();

      const filteredOrders = orders.filter((o) => {
        const isConditionalOrder = o.orderFlags === OrderFlags.CONDITIONAL;
        const isReduceOnly = o.reduceOnly;
        const isActiveOrder = o.status === OrderStatus.Open || o.status === OrderStatus.Untriggered;
        return isConditionalOrder && isReduceOnly && isActiveOrder;
      });

      // Add orders to cancel if they are orphaned, or if the reduce-only order would increase the position
      filteredOrders.forEach((o) => {
        const position = groupedPositions[o.positionUniqueId]?.[0];
        if (position == null) {
          ordersToCancel.add(o);
        } else if (position.side === IndexerPositionSide.LONG && o.side === IndexerOrderSide.BUY) {
          ordersToCancel.add(o);
        } else if (
          position.side === IndexerPositionSide.SHORT &&
          o.side === IndexerOrderSide.SELL
        ) {
          ordersToCancel.add(o);
        }
      });

      return {
        ...authorizedAccount,
        ordersToCancel: Array.from(ordersToCancel),
      };
    }
  );

  const activeOrderCancellations = createSemaphore();
  let canceledOrderIds = new Set<string>();

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null) {
        return undefined;
      }

      async function cancelTriggerOrdersWithClosedOrFlippedPositions() {
        const { ordersToCancel, localDydxWallet } = data!;

        ordersToCancel.forEach(async (o) => {
          const {
            id,
            clientId,
            subaccountNumber,
            orderFlags,
            clobPairId,
            goodTilBlock,
            goodTilBlockTime,
          } = o;

          if (canceledOrderIds.has(id)) {
            return;
          }

          if (clientId == null || orderFlags == null || clobPairId == null) {
            throw new Error('Missing required fields');
          }

          const subaccountClient = new SubaccountClient(localDydxWallet!, subaccountNumber);
          const clientIdInt = parseInt(clientId, 10);
          const orderFlagsInt = parseInt(orderFlags, 10);
          const goodTilBlockTimeSeconds = goodTilBlockTime
            ? Math.floor(goodTilBlockTime / 1000)
            : undefined;

          canceledOrderIds.add(id);

          logBonsaiInfo('cancelOrphanedTriggerOrdersLifecycle', 'cancelling trigger order', {
            id,
            clientIdInt,
            orderFlagsInt,
            clobPairId,
            goodTilBlock,
          });

          await compositeClient.cancelRawOrder(
            subaccountClient,
            clientIdInt,
            orderFlagsInt,
            clobPairId,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            goodTilBlock || undefined, // goodTilBlock of 0 will be submitted as undefined
            goodTilBlockTimeSeconds
          );

          // TODO: track analytics event TradeCancelOrder and TradeCancelOrderSubmissionConfirmed
        });
      }

      if (data.sourceAccount.chain === WalletNetworkType.Cosmos || data.localDydxWallet == null) {
        return undefined;
      }

      activeOrderCancellations
        .run(() => cancelTriggerOrdersWithClosedOrFlippedPositions())
        .catch((error) => {
          if (error instanceof SupersededError) {
            return;
          }

          // TODO: track analytics event TradeCancelOrderSubmissionFailed
          logBonsaiError(
            'cancelOrphanedTriggerOrdersLifecycle',
            'error trying to cancel trigger orders',
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
    canceledOrderIds = new Set<string>();
    activeOrderCancellations.clear();
    noopCleanupEffect();
  };
}
