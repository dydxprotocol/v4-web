import { CompositeClient, LocalWallet, SubaccountClient } from '@dydxprotocol/v4-client-js';
import { keyBy } from 'lodash';

import { timeUnits } from '@/constants/time';
import { WalletNetworkType } from '@/constants/wallets';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { stringifyTransactionError } from '@/lib/errors';
import { parseToPrimitives } from '@/lib/parseToPrimitives';
import { sleep } from '@/lib/timeUtils';

import { wrapOperationFailure, wrapOperationSuccess } from '../lib/operationResult';
import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectParentSubaccountOpenPositions } from '../selectors/account';
import { selectTxAuthorizedAccount } from '../selectors/accountTransaction';
import { OrderFlags, OrderStatus, SubaccountOrder } from '../types/summaryTypes';

// Sleep time between rebalances to ensure that the subaccount has time to process the previous transaction
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
  let canceledOrderIds = new Set<string>();

  async function doCancelOrder(
    client: CompositeClient,
    localDydxWallet: LocalWallet,
    order: SubaccountOrder
  ) {
    try {
      const {
        id,
        clientId,
        subaccountNumber,
        orderFlags,
        clobPairId,
        goodTilBlock,
        goodTilBlockTimeSeconds,
      } = order;

      if (clientId == null || orderFlags == null || clobPairId == null) {
        throw new Error('missing required fields');
      }

      canceledOrderIds.add(id);
      const subaccountClient = new SubaccountClient(localDydxWallet!, subaccountNumber);
      const clientIdInt = parseInt(clientId, 10);
      const orderFlagsInt = parseInt(orderFlags, 10);

      const tx = await client.cancelRawOrder(
        subaccountClient,
        clientIdInt,
        orderFlagsInt,
        clobPairId,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        goodTilBlock || undefined, // goodTilBlock of 0 will be submitted as undefined
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        goodTilBlockTimeSeconds || undefined // goodTilBlockTimeSeconds of 0 will be submitted as undefined
      );

      const parsedTx = parseToPrimitives(tx);

      logBonsaiInfo(
        'cancelOrphanedTriggerOrdersLifecycle',
        'successfully cancelled trigger order',
        {
          id,
          clientIdInt,
          orderFlagsInt,
          clobPairId,
          goodTilBlock,
        }
      );

      return wrapOperationSuccess(parsedTx);
    } catch (error) {
      const parsed = stringifyTransactionError(error);
      logBonsaiError('cancelOrphanedTriggerOrdersLifecycle', 'Failed to cancel trigger orders', {
        error,
      });
      return wrapOperationFailure(parsed);
    } finally {
      await sleep(SLEEP_TIME);
    }
  }

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null || !data.localDydxWallet) {
        return undefined;
      }

      async function cancelTriggerOrdersWithClosedOrFlippedPositions() {
        const { ordersToCancel, localDydxWallet } = data!;

        await Promise.all(
          ordersToCancel.map(async (o) => {
            if (canceledOrderIds.has(o.id)) {
              return null;
            }

            canceledOrderIds.add(o.id);

            return doCancelOrder(compositeClient, localDydxWallet!, o);
          })
        );
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
    canceledOrderIds = new Set<string>();
    activeOrderCancellations.clear();
    noopCleanupEffect();
  };
}
