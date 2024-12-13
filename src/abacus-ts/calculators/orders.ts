import { IndexerBestEffortOpenedStatus, IndexerOrderStatus } from '@/types/indexer/indexerApiGen';
import { IndexerCompositeOrderObject } from '@/types/indexer/indexerManual';
import { maxBy, pickBy } from 'lodash';

import { SubaccountOrder } from '@/constants/abacus';

import { assertNever } from '@/lib/assertNever';
import { MustBigNumber } from '@/lib/numbers';

import { Loadable } from '../lib/loadable';
import { OrdersData } from '../rawTypes';
import { OrderStatus } from '../summaryTypes';

const BN_0 = MustBigNumber(0);
const BN_1 = MustBigNumber(1);

// todo these are calculating the same thing twice pasically
function calculateOpenOrders(liveOrders: Loadable<OrdersData>, restOrders: Loadable<OrdersData>) {
  const getOpenOrders = (data: Loadable<OrdersData>) =>
    mapLoadableData(data, (d) =>
      pickBy(
        d,
        (order) =>
          getSimpleOrderStatus(calculateOrderStatus(order) ?? OrderStatus.Open) === OrderStatus.Open
      )
    );
  return calculateMergedOrders(getOpenOrders(liveOrders), getOpenOrders(restOrders));
}

function calculateOrderHistory(liveOrders: Loadable<OrdersData>, restOrders: Loadable<OrdersData>) {
  const getNonOpenOrders = (data: Loadable<OrdersData>) =>
    mapLoadableData(data, (d) =>
      pickBy(
        d,
        (order) =>
          getSimpleOrderStatus(calculateOrderStatus(order) ?? OrderStatus.Open) !== OrderStatus.Open
      )
    );
  return calculateMergedOrders(getNonOpenOrders(liveOrders), getNonOpenOrders(restOrders));
}

function calculateSubaccountOrder(
  order: IndexerCompositeOrderObject,
  protocolHeight: number
): SubaccountOrder {}

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
      return OrderStatus.Open;
  }
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

function calculateMergedOrders(liveOrders: Loadable<OrdersData>, restOrders: Loadable<OrdersData>) {
  const liveData = liveOrders.data ?? {};
  const restData = restOrders.data ?? {};
  return mergeObjects(
    liveData,
    restData,
    (a, b) =>
      maxBy([a, b], (o) => MustBigNumber(o.updatedAtHeight ?? o.createdAtHeight).toNumber())!
  );
}

function mapLoadableData<T, R>(load: Loadable<T>, map: (obj: T) => R): Loadable<R> {
  return {
    ...load,
    data: load.data != null ? map(load.data) : undefined,
  } as Loadable<R>;
}

type SimpleMap<T> = { [key: string]: T };
function mergeObjects<T>(one: SimpleMap<T>, two: SimpleMap<T>, merge: (a: T, b: T) => T) {
  const finalObj: SimpleMap<T> = {};

  [...Object.keys(one), ...Object.keys(two)].forEach((key) => {
    if (finalObj[key] != null) {
      return;
    }
    const obj = one[key];
    const otherObj = two[key];
    if (obj != null && otherObj != null) {
      finalObj[key] = merge(obj, otherObj);
    } else if (obj == null && otherObj == null) {
      // do nothing
    } else {
      // we know one of them is non-null
      finalObj[key] = (obj ?? otherObj)!;
    }
  });
  return finalObj;
}
