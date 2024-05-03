import { DateTime } from 'luxon';

import {
  AbacusOrderStatus,
  AbacusOrderType,
  AbacusOrderTypes,
  KotlinIrEnumValues,
  TRADE_TYPES,
  type Asset,
  type OrderStatus,
  type PerpetualMarket,
  type SubaccountFill,
  type SubaccountFundingPayment,
  type SubaccountOrder,
} from '@/constants/abacus';

import { IconName } from '@/components/Icon';

import { convertAbacusOrderSide } from '@/lib/abacus/conversions';

export const getOrderStatusInfo = ({ status }: { status: string }) => {
  switch (status) {
    case AbacusOrderStatus.open.rawValue: {
      return {
        statusIcon: IconName.OrderOpen,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case AbacusOrderStatus.partiallyFilled.rawValue:
      return {
        statusIcon: IconName.OrderPartiallyFilled,
        statusIconColor: `var(--color-warning)`,
      };
    case AbacusOrderStatus.filled.rawValue: {
      return {
        statusIcon: IconName.OrderFilled,
        statusIconColor: `var(--color-success)`,
      };
    }
    case AbacusOrderStatus.cancelled.rawValue: {
      return {
        statusIcon: IconName.OrderCanceled,
        statusIconColor: `var(--color-error)`,
      };
    }
    case AbacusOrderStatus.canceling.rawValue: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-error)`,
      };
    }
    case AbacusOrderStatus.untriggered.rawValue: {
      return {
        statusIcon: IconName.OrderUntriggered,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case AbacusOrderStatus.pending.rawValue:
    default: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-text-2)`,
      };
    }
  }
};

export const isOrderStatusClearable = (status: OrderStatus) =>
  [AbacusOrderStatus.filled, AbacusOrderStatus.cancelled].some(
    (orderStatus) => status === orderStatus
  );

export const isMarketOrderType = (type?: AbacusOrderTypes) =>
  type &&
  [
    AbacusOrderType.market,
    AbacusOrderType.stopMarket,
    AbacusOrderType.takeProfitMarket,
    AbacusOrderType.trailingStop,
  ].some(({ ordinal }) => ordinal === type.ordinal);

export const isLimitOrderType = (type?: AbacusOrderTypes) =>
  type &&
  [AbacusOrderType.limit, AbacusOrderType.stopLimit, AbacusOrderType.takeProfitLimit].some(
    ({ ordinal }) => ordinal === type.ordinal
  );

export const isStopLossOrder = (order: SubaccountOrder, isSlTpLimitOrdersEnabled: boolean) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [AbacusOrderType.stopLimit, AbacusOrderType.stopMarket]
    : [AbacusOrderType.stopMarket];
  return validOrderTypes.some(({ ordinal }) => ordinal === order.type.ordinal) && order.reduceOnly;
};

export const isTakeProfitOrder = (order: SubaccountOrder, isSlTpLimitOrdersEnabled: boolean) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [AbacusOrderType.takeProfitLimit, AbacusOrderType.takeProfitMarket]
    : [AbacusOrderType.takeProfitMarket];
  return validOrderTypes.some(({ ordinal }) => ordinal === order.type.ordinal) && order.reduceOnly;
};

export const relativeTimeString = ({
  timeInMs,
  selectedLocale,
}: {
  timeInMs: number;
  selectedLocale: string;
}) =>
  DateTime.fromMillis(timeInMs).setLocale(selectedLocale).toLocaleString(DateTime.DATETIME_SHORT);

export const getHydratedTradingData = ({
  data,
  assets,
  perpetualMarkets,
}: {
  data: SubaccountOrder | SubaccountFill | SubaccountFundingPayment;
  assets?: Record<string, Asset>;
  perpetualMarkets?: Record<string, PerpetualMarket>;
}) => ({
  ...data,
  asset: assets && perpetualMarkets && assets[perpetualMarkets[data.marketId]?.assetId],
  stepSizeDecimals: perpetualMarkets?.[data.marketId]?.configs?.stepSizeDecimals,
  tickSizeDecimals: perpetualMarkets?.[data.marketId]?.configs?.tickSizeDecimals,
  ...('side' in data && { orderSide: convertAbacusOrderSide(data.side) }),
});

export const getTradeType = (orderType: string) =>
  TRADE_TYPES[orderType as KotlinIrEnumValues<typeof AbacusOrderType>];
