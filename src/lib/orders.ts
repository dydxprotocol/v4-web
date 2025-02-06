// eslint-disable-next-line no-restricted-imports
import { getSimpleOrderStatus } from '@/bonsai/calculators/orders';
import {
  SubaccountOrder as NewSubaccountOrder,
  OrderStatus as OrderStatusNew,
  PerpetualMarketSummaries,
  PerpetualMarketSummary,
  SubaccountFill as SubaccountFillNew,
} from '@/bonsai/types/summaryTypes';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import {
  AbacusOrderSide,
  AbacusOrderStatus,
  AbacusOrderType,
  AbacusOrderTypes,
  KotlinIrEnumValues,
  Nullable,
  OrderStatus,
  SubaccountFill,
  TRADE_TYPES,
  type Asset,
  type PerpetualMarket,
  type SubaccountFundingPayment,
  type SubaccountOrder,
} from '@/constants/abacus';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { IconName } from '@/components/Icon';

import { convertAbacusOrderSide } from '@/lib/abacus/conversions';

export const getOrderStatusInfo = ({ status }: { status: string }) => {
  switch (status) {
    case AbacusOrderStatus.Open.rawValue: {
      return {
        statusIcon: IconName.OrderOpen,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case AbacusOrderStatus.PartiallyFilled.rawValue:
    case AbacusOrderStatus.PartiallyCanceled.rawValue: {
      return {
        statusIcon: IconName.OrderPartiallyFilled,
        statusIconColor: `var(--color-warning)`,
      };
    }
    case AbacusOrderStatus.Filled.rawValue: {
      return {
        statusIcon: IconName.OrderFilled,
        statusIconColor: `var(--color-success)`,
      };
    }
    case AbacusOrderStatus.Canceled.rawValue: {
      return {
        statusIcon: IconName.OrderCanceled,
        statusIconColor: `var(--color-error)`,
      };
    }
    case AbacusOrderStatus.Canceling.rawValue: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-error)`,
      };
    }
    case AbacusOrderStatus.Untriggered.rawValue: {
      return {
        statusIcon: IconName.OrderUntriggered,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case AbacusOrderStatus.Pending.rawValue:
    default: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-text-2)`,
      };
    }
  }
};

export const getOrderStatusInfoNew = ({ status }: { status: OrderStatusNew }) => {
  switch (status) {
    case OrderStatusNew.Open: {
      return {
        statusIcon: IconName.OrderOpen,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case OrderStatusNew.PartiallyFilled:
    case OrderStatusNew.PartiallyCanceled: {
      return {
        statusIcon: IconName.OrderPartiallyFilled,
        statusIconColor: `var(--color-warning)`,
      };
    }
    case OrderStatusNew.Filled: {
      return {
        statusIcon: IconName.OrderFilled,
        statusIconColor: `var(--color-success)`,
      };
    }
    case OrderStatusNew.Canceled: {
      return {
        statusIcon: IconName.OrderCanceled,
        statusIconColor: `var(--color-error)`,
      };
    }
    case OrderStatusNew.Canceling: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-error)`,
      };
    }
    case OrderStatusNew.Untriggered: {
      return {
        statusIcon: IconName.OrderUntriggered,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case OrderStatusNew.Pending:
    default: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-text-2)`,
      };
    }
  }
};

export const isNewOrderStatusOpen = (status: OrderStatusNew) =>
  getSimpleOrderStatus(status) === OrderStatusNew.Open;

export const isOrderStatusOpen = (status: OrderStatus) =>
  [
    AbacusOrderStatus.Open,
    AbacusOrderStatus.Pending,
    AbacusOrderStatus.PartiallyFilled,
    AbacusOrderStatus.Untriggered,
  ].some((orderStatus) => status === orderStatus);

export const isOrderStatusClearable = (status: OrderStatus) =>
  status === AbacusOrderStatus.Filled || isOrderStatusCanceled(status);

export const isNewOrderStatusClearable = (status: OrderStatusNew) =>
  getSimpleOrderStatus(status) === OrderStatusNew.Canceled ||
  getSimpleOrderStatus(status) === OrderStatusNew.Filled;

export const isOrderStatusCanceled = (status: OrderStatus) =>
  [AbacusOrderStatus.Canceled, AbacusOrderStatus.PartiallyCanceled].some(
    (orderStatus) => status === orderStatus
  );
export const isNewOrderStatusCanceled = (status: OrderStatusNew) =>
  getSimpleOrderStatus(status) === OrderStatusNew.Canceled;

export const isMarketOrderType = (type?: AbacusOrderTypes) =>
  type &&
  [
    AbacusOrderType.Market,
    AbacusOrderType.StopMarket,
    AbacusOrderType.TakeProfitMarket,
    AbacusOrderType.TrailingStop,
  ].some(({ ordinal }) => ordinal === type.ordinal);

export const isMarketOrderTypeNew = (type?: IndexerOrderType) =>
  type &&
  [
    IndexerOrderType.MARKET,
    IndexerOrderType.STOPMARKET,
    IndexerOrderType.TAKEPROFITMARKET,
    IndexerOrderType.TRAILINGSTOP,
  ].includes(type);

export const isLimitOrderType = (type?: AbacusOrderTypes) =>
  type &&
  [AbacusOrderType.Limit, AbacusOrderType.StopLimit, AbacusOrderType.TakeProfitLimit].some(
    ({ ordinal }) => ordinal === type.ordinal
  );

export const isLimitOrderTypeNew = (type?: IndexerOrderType) =>
  type &&
  [IndexerOrderType.LIMIT, IndexerOrderType.STOPLIMIT, IndexerOrderType.TAKEPROFIT].includes(type);

export const isStopLossOrder = (order: SubaccountOrder, isSlTpLimitOrdersEnabled: boolean) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [AbacusOrderType.StopLimit, AbacusOrderType.StopMarket]
    : [AbacusOrderType.StopMarket];
  return validOrderTypes.some(({ ordinal }) => ordinal === order.type.ordinal) && order.reduceOnly;
};
export const isStopLossOrderNew = (
  order: NewSubaccountOrder,
  isSlTpLimitOrdersEnabled: boolean
) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [IndexerOrderType.STOPLIMIT, IndexerOrderType.STOPMARKET]
    : [IndexerOrderType.STOPMARKET];
  return order.reduceOnly && validOrderTypes.includes(order.type);
};

export const isTakeProfitOrder = (order: SubaccountOrder, isSlTpLimitOrdersEnabled: boolean) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [AbacusOrderType.TakeProfitLimit, AbacusOrderType.TakeProfitMarket]
    : [AbacusOrderType.TakeProfitMarket];
  return validOrderTypes.some(({ ordinal }) => ordinal === order.type.ordinal) && order.reduceOnly;
};

export const isTakeProfitOrderNew = (
  order: NewSubaccountOrder,
  isSlTpLimitOrdersEnabled: boolean
) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [IndexerOrderType.TAKEPROFIT, IndexerOrderType.TAKEPROFITMARKET]
    : [IndexerOrderType.TAKEPROFITMARKET];
  return order.reduceOnly && validOrderTypes.includes(order.type);
};

export const isSellOrder = (order: SubaccountOrder) => {
  return order.side.ordinal === AbacusOrderSide.Sell.ordinal;
};

export const isSellOrderNew = (order: NewSubaccountOrder) => {
  return order.side === IndexerOrderSide.SELL;
};

type AddedProps = {
  asset: Asset | undefined;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
  orderSide?: Nullable<OrderSide>;
};

export const getHydratedTradingData = <
  T extends SubaccountOrder | SubaccountFill | SubaccountFundingPayment,
>({
  data,
  assets,
  perpetualMarkets,
}: {
  data: T;
  assets: Record<string, Asset>;
  perpetualMarkets: Record<string, PerpetualMarket>;
}): T & AddedProps => ({
  ...data,
  asset: assets[perpetualMarkets[data.marketId]?.assetId ?? ''],
  stepSizeDecimals: perpetualMarkets[data.marketId]?.configs?.stepSizeDecimals,
  tickSizeDecimals: perpetualMarkets[data.marketId]?.configs?.tickSizeDecimals,
  ...('side' in data && { orderSide: convertAbacusOrderSide(data.side) }),
});

type NewAddedProps = {
  marketSummary: PerpetualMarketSummary | undefined;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
};

export const getHydratedOrder = ({
  data,
  marketSummaries,
}: {
  data: NewSubaccountOrder;
  marketSummaries: PerpetualMarketSummaries;
}): NewSubaccountOrder & NewAddedProps => {
  return {
    ...data,
    marketSummary: marketSummaries[data.marketId],
    stepSizeDecimals: marketSummaries[data.marketId]?.stepSizeDecimals ?? TOKEN_DECIMALS,
    tickSizeDecimals: marketSummaries[data.marketId]?.tickSizeDecimals ?? USD_DECIMALS,
  };
};

export const getHydratedFill = ({
  data,
  marketSummaries,
}: {
  data: SubaccountFillNew;
  marketSummaries: PerpetualMarketSummaries;
}): SubaccountFillNew & NewAddedProps => {
  return {
    ...data,
    marketSummary: marketSummaries[data.market ?? ''],
    stepSizeDecimals: marketSummaries[data.market ?? '']?.stepSizeDecimals ?? TOKEN_DECIMALS,
    tickSizeDecimals: marketSummaries[data.market ?? '']?.tickSizeDecimals ?? USD_DECIMALS,
  };
};

export const getTradeType = (orderType: string) =>
  TRADE_TYPES[orderType as KotlinIrEnumValues<typeof AbacusOrderType>];

export const getAverageFillPrice = (fills: SubaccountFillNew[]) => {
  let total = BigNumber(0);
  let totalSize = BigNumber(0);
  fills.forEach((fill) => {
    total = total.plus(BigNumber(fill.price ?? 0).times(fill.size ?? 0));
    totalSize = totalSize.plus(fill.size ?? 0);
  });
  return totalSize.gt(0) ? total.div(totalSize) : null;
};
