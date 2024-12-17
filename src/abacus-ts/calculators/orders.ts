import { IndexerBestEffortOpenedStatus, IndexerOrderStatus } from '@/types/indexer/indexerApiGen';
import { IndexerCompositeOrderObject } from '@/types/indexer/indexerManual';
import { HeightResponse } from '@dydxprotocol/v4-client-js';
import { mapValues, maxBy, pickBy } from 'lodash';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';

import { assertNever } from '@/lib/assertNever';
import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { Loadable } from '../lib/loadable';
import { mapLoadableData, mergeLoadableData } from '../lib/mapLoadable';
import { mergeObjects } from '../lib/mergeObjects';
import { OrdersData } from '../rawTypes';
import { OrderStatus, SubaccountOrder, SubaccountOrdersData } from '../summaryTypes';

export function calculateOpenOrders(orders: Loadable<SubaccountOrdersData>) {
  return mapLoadableData(orders, (d) =>
    pickBy(
      d,
      (order) => getSimpleOrderStatus(order.status ?? OrderStatus.Open) === OrderStatus.Open
    )
  );
}

export function calculateOrderHistory(orders: Loadable<SubaccountOrdersData>) {
  return mapLoadableData(orders, (d) =>
    pickBy(
      d,
      (order) => getSimpleOrderStatus(order.status ?? OrderStatus.Open) !== OrderStatus.Open
    )
  );
}

export function calculateAllOrders(
  liveOrders: Loadable<OrdersData>,
  restOrders: Loadable<OrdersData>,
  height: HeightResponse
): Loadable<SubaccountOrdersData> {
  const merged = mergeLoadableData(liveOrders, restOrders);
  const actuallyMerged = mapLoadableData(merged, ([a, b]) =>
    calculateMergedOrders(a ?? {}, b ?? {})
  );
  const mapped = mapLoadableData(actuallyMerged, (d) =>
    mapValues(d, (order) => calculateSubaccountOrder(order, height))
  );
  return mapped;
}

function calculateSubaccountOrder(
  base: IndexerCompositeOrderObject,
  protocolHeight: HeightResponse
): SubaccountOrder {
  let order: SubaccountOrder = {
    marketId: base.ticker,
    status: calculateBaseOrderStatus(base),
    displayId: getDisplayableTickerFromMarket(base.ticker),
    expiresAtMilliseconds: mapIfPresent(base.goodTilBlockTime, (u) => new Date(u).valueOf()),
    updatedAtMilliseconds: mapIfPresent(base.updatedAt, (u) => new Date(u).valueOf()),
    updatedAtHeight: MaybeBigNumber(base.updatedAtHeight)?.toNumber(),
    marginMode: base.subaccountNumber >= NUM_PARENT_SUBACCOUNTS ? 'ISOLATED' : 'CROSS',
    subaccountNumber: base.subaccountNumber,
    id: base.id,
    clientId: base.clientId,
    type: base.type,
    side: base.side,
    timeInForce: base.timeInForce,
    clobPairId: MaybeBigNumber(base.clobPairId)?.toNumber(),
    orderFlags: base.orderFlags,
    price: MustBigNumber(base.price),
    triggerPrice: MaybeBigNumber(base.triggerPrice),
    size: MustBigNumber(base.size),
    totalFilled: MustBigNumber(base.totalFilled),
    goodTilBlock: MaybeBigNumber(base.goodTilBlock)?.toNumber(),
    goodTilBlockTime: mapIfPresent(base.goodTilBlockTime, (u) => new Date(u).valueOf()),
    createdAtHeight: MaybeBigNumber(base.createdAtHeight)?.toNumber(),
    postOnly: !!base.postOnly,
    reduceOnly: !!base.reduceOnly,
    remainingSize: MustBigNumber(base.size).minus(MustBigNumber(base.totalFilled)),
    removalReason: base.removalReason,
  };
  order = maybeUpdateOrderIfExpired(order, protocolHeight);
  return order;
}

function getSimpleOrderStatus(status: OrderStatus) {
  switch (status) {
    case OrderStatus.Open:
    case OrderStatus.Pending:
    case OrderStatus.PartiallyFilled:
    case OrderStatus.Untriggered:
    case OrderStatus.Canceling:
      return OrderStatus.Open;
    case OrderStatus.Canceled:
    case OrderStatus.PartiallyCanceled:
      return OrderStatus.Canceled;
    case OrderStatus.Filled:
      return OrderStatus.Filled;
    default:
      assertNever(status);
      // should never happen since we made OrderStatus manually
      return OrderStatus.Open;
  }
}

function maybeUpdateOrderIfExpired(
  order: SubaccountOrder,
  height: HeightResponse
): SubaccountOrder {
  if (order.status == null) {
    return order;
  }
  // todo: why not handle Open?
  if (
    ![OrderStatus.Pending, OrderStatus.Canceling, OrderStatus.PartiallyFilled].includes(
      order.status
    )
  ) {
    return order;
  }

  // Check if order has expired based on goodTilBlock
  if (order.goodTilBlock && order.goodTilBlock !== 0 && height.height >= order.goodTilBlock) {
    let status = OrderStatus.Canceled;

    // Check for partial fills
    if (order.totalFilled != null && order.totalFilled.gt(0)) {
      const remainingSize = order.size.minus(order.totalFilled);
      if (order.totalFilled.gt(0) && remainingSize.gt(0)) {
        status = OrderStatus.PartiallyCanceled;
      }
    }

    return {
      ...order,
      status,
      updatedAtMilliseconds: new Date(height.time).valueOf(),
    };
  }

  return order;
}

function calculateBaseOrderStatus(order: IndexerCompositeOrderObject): OrderStatus | undefined {
  const status = order.status;
  if (status == null) {
    return undefined;
  }

  if (status === IndexerBestEffortOpenedStatus.BESTEFFORTOPENED) {
    return OrderStatus.Pending;
  }

  // Calculate filled amounts
  const size = MustBigNumber(order.size);
  const totalFilled = MustBigNumber(order.totalFilled);
  const remainingSize = size.minus(totalFilled);
  const hasPartialFill = totalFilled.gt(0) && remainingSize.gt(0);

  // Handle partial fills
  if (hasPartialFill) {
    if (status === IndexerOrderStatus.OPEN) {
      return OrderStatus.PartiallyFilled;
    }
    if (status === IndexerOrderStatus.CANCELED) {
      return OrderStatus.PartiallyCanceled;
    }
  }

  // Handle short-term order edge case
  const isShortTermOrder = order.orderFlags === '0';
  const isBestEffortCanceled = status === IndexerOrderStatus.BESTEFFORTCANCELED;
  const isUserCanceled =
    order.removalReason === 'USER_CANCELED' ||
    order.removalReason === 'ORDER_REMOVAL_REASON_USER_CANCELED';

  if (isShortTermOrder && isBestEffortCanceled && !isUserCanceled) {
    return OrderStatus.Pending;
  }

  // Direct mapping for remaining cases
  switch (status) {
    case IndexerOrderStatus.OPEN:
      return OrderStatus.Open;
    case IndexerOrderStatus.FILLED:
      return OrderStatus.Filled;
    case IndexerOrderStatus.CANCELED:
      return OrderStatus.Canceled;
    case IndexerOrderStatus.BESTEFFORTCANCELED:
      return OrderStatus.Canceling;
    case IndexerOrderStatus.UNTRIGGERED:
      return OrderStatus.Untriggered;
    default:
      assertNever(status);
      return undefined;
  }
}

function calculateMergedOrders(liveData: OrdersData, restData: OrdersData) {
  return mergeObjects(
    liveData,
    restData,
    (a, b) =>
      maxBy([a, b], (o) => MustBigNumber(o.updatedAtHeight ?? o.createdAtHeight).toNumber())!
  );
}
