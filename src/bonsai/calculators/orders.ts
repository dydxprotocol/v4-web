import { HeightResponse } from '@dydxprotocol/v4-client-js';
import { mapValues, maxBy, orderBy } from 'lodash';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import {
  IndexerBestEffortOpenedStatus,
  IndexerOrderStatus,
  IndexerOrderType,
} from '@/types/indexer/indexerApiGen';
import { IndexerCompositeOrderObject } from '@/types/indexer/indexerManual';

import { assertNever } from '@/lib/assertNever';
import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';
import { OrdersData } from '../types/rawTypes';
import { OrderStatus, SubaccountOrder } from '../types/summaryTypes';
import { getPositionUniqueId } from './helpers';

export function calculateOpenOrders(orders: SubaccountOrder[]) {
  return orders.filter(
    (order) => order.status == null || getSimpleOrderStatus(order.status) === OrderStatus.Open
  );
}

export function calculateOrderHistory(orders: SubaccountOrder[]) {
  return orders.filter(
    (order) => order.status != null && getSimpleOrderStatus(order.status) !== OrderStatus.Open
  );
}

export function calculateAllOrders(
  liveOrders: OrdersData | undefined,
  restOrders: OrdersData | undefined,
  height: HeightResponse
): SubaccountOrder[] {
  const actuallyMerged = calculateMergedOrders(liveOrders ?? {}, restOrders ?? {});
  const mapped = mapValues(actuallyMerged, (order) => calculateSubaccountOrder(order, height));
  return orderBy(Object.values(mapped), [(o) => o.updatedAtHeight], ['desc']);
}

function calculateSubaccountOrder(
  base: IndexerCompositeOrderObject,
  protocolHeight: HeightResponse
): SubaccountOrder {
  let order: SubaccountOrder = {
    marketId: base.ticker,
    status: calculateBaseOrderStatus(base, protocolHeight),
    displayId: getDisplayableTickerFromMarket(base.ticker),
    expiresAtMilliseconds: mapIfPresent(base.goodTilBlockTime, (u) => new Date(u).valueOf()),
    updatedAtMilliseconds: mapIfPresent(base.updatedAt, (u) => new Date(u).valueOf()),
    updatedAtHeight: MaybeBigNumber(base.updatedAtHeight)?.toNumber(),
    marginMode: base.subaccountNumber >= NUM_PARENT_SUBACCOUNTS ? 'ISOLATED' : 'CROSS',
    subaccountNumber: base.subaccountNumber,
    id: base.id,
    positionUniqueId: getPositionUniqueId(base.ticker, base.subaccountNumber),
    clientId: base.clientId,
    type: getOrderType(base.type, base.clientMetadata),
    side: base.side,
    timeInForce: base.timeInForce,
    clobPairId: MaybeBigNumber(base.clobPairId)?.toNumber(),
    orderFlags: base.orderFlags,
    price: MustBigNumber(base.price),
    triggerPrice: MaybeBigNumber(base.triggerPrice),
    size: MustBigNumber(base.size),
    totalFilled: MustBigNumber(base.totalFilled),
    goodTilBlock: MaybeBigNumber(base.goodTilBlock)?.toNumber(),
    goodTilBlockTimeMilliseconds: mapIfPresent(base.goodTilBlockTime, (u) => new Date(u).valueOf()),
    goodTilBlockTimeSeconds: mapIfPresent(base.goodTilBlockTime, (u) =>
      Math.floor(new Date(u).valueOf() / 1000)
    ),
    createdAtHeight: MaybeBigNumber(base.createdAtHeight)?.toNumber(),
    postOnly: !!base.postOnly,
    reduceOnly: !!base.reduceOnly,
    remainingSize: MustBigNumber(base.size).minus(MustBigNumber(base.totalFilled)),
    removalReason: base.removalReason,
  };
  order = maybeUpdateOrderIfExpired(order, protocolHeight);
  return order;
}

function getOrderType(
  type: IndexerOrderType,
  clientMetadata: string | undefined
): IndexerOrderType {
  if (clientMetadata === '1') {
    switch (type) {
      case IndexerOrderType.LIMIT:
        return IndexerOrderType.MARKET;
      case IndexerOrderType.STOPLIMIT:
        return IndexerOrderType.STOPMARKET;
      case IndexerOrderType.TAKEPROFIT:
        return IndexerOrderType.TAKEPROFITMARKET;
      default:
        return type;
    }
  }
  return type;
}

export function getSimpleOrderStatus(status: OrderStatus) {
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
      updatedAtHeight: height.height,
    };
  }

  return order;
}

const ORDER_CANCELLING_ALLOWANCE_BLOCKS = 25;

function calculateBaseOrderStatus(
  order: IndexerCompositeOrderObject,
  protocolHeight: HeightResponse
): OrderStatus | undefined {
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

  if (isBestEffortCanceled) {
    const { goodTilBlock } = order;
    if (goodTilBlock == null) {
      return OrderStatus.Canceled;
    }
    if (
      MustBigNumber(goodTilBlock).plus(ORDER_CANCELLING_ALLOWANCE_BLOCKS).lt(protocolHeight.height)
    ) {
      return OrderStatus.Canceled;
    }
  }

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
