import { getSimpleOrderStatus } from '@/abacus-ts/calculators/orders';
import { AssetInfo, AssetInfos, MarketsData } from '@/abacus-ts/rawTypes';
import {
  SubaccountOrder as NewSubaccountOrder,
  OrderStatus as OrderStatusNew,
} from '@/abacus-ts/summaryTypes';
import { IndexerOrderType } from '@/types/indexer/indexerApiGen';
import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';
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
  SubaccountFills,
  TRADE_TYPES,
  type Asset,
  type PerpetualMarket,
  type SubaccountFundingPayment,
  type SubaccountOrder,
} from '@/constants/abacus';

import { IconName } from '@/components/Icon';

import { convertAbacusOrderSide } from '@/lib/abacus/conversions';

import { getAssetFromMarketId } from './assetUtils';
import { MaybeBigNumber } from './numbers';

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
  ].some((t) => t === type);

export const isLimitOrderType = (type?: AbacusOrderTypes) =>
  type &&
  [AbacusOrderType.Limit, AbacusOrderType.StopLimit, AbacusOrderType.TakeProfitLimit].some(
    ({ ordinal }) => ordinal === type.ordinal
  );

export const isStopLossOrder = (order: SubaccountOrder, isSlTpLimitOrdersEnabled: boolean) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [AbacusOrderType.StopLimit, AbacusOrderType.StopMarket]
    : [AbacusOrderType.StopMarket];
  return validOrderTypes.some(({ ordinal }) => ordinal === order.type.ordinal) && order.reduceOnly;
};

export const isTakeProfitOrder = (order: SubaccountOrder, isSlTpLimitOrdersEnabled: boolean) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [AbacusOrderType.TakeProfitLimit, AbacusOrderType.TakeProfitMarket]
    : [AbacusOrderType.TakeProfitMarket];
  return validOrderTypes.some(({ ordinal }) => ordinal === order.type.ordinal) && order.reduceOnly;
};

export const isSellOrder = (order: SubaccountOrder) => {
  return order.side.ordinal === AbacusOrderSide.Sell.ordinal;
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
  asset: AssetInfo | undefined;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
};

export const getHydratedOrder = ({
  data,
  assets,
  perpetualMarkets,
}: {
  data: NewSubaccountOrder;
  assets: AssetInfos;
  perpetualMarkets: MarketsData;
}): NewSubaccountOrder & NewAddedProps => {
  return {
    ...data,
    asset: assets[getAssetFromMarketId(data.marketId)],
    stepSizeDecimals: MaybeBigNumber(perpetualMarkets[data.marketId]?.stepSize)?.decimalPlaces(),
    tickSizeDecimals: MaybeBigNumber(perpetualMarkets[data.marketId]?.tickSize)?.decimalPlaces(),
  };
};

export const getHydratedFill = ({
  data,
  assets,
  perpetualMarkets,
}: {
  data: IndexerCompositeFillObject;
  assets: AssetInfos;
  perpetualMarkets: MarketsData;
}): IndexerCompositeFillObject & NewAddedProps => {
  return {
    ...data,
    asset: assets[getAssetFromMarketId(data.market ?? '')],
    stepSizeDecimals: MaybeBigNumber(
      perpetualMarkets[data.market ?? '']?.stepSize
    )?.decimalPlaces(),
    tickSizeDecimals: MaybeBigNumber(
      perpetualMarkets[data.market ?? '']?.tickSize
    )?.decimalPlaces(),
  };
};

export const getTradeType = (orderType: string) =>
  TRADE_TYPES[orderType as KotlinIrEnumValues<typeof AbacusOrderType>];

export const getAverageFillPrice = (fills: SubaccountFills) => {
  let total = BigNumber(0);
  let totalSize = BigNumber(0);
  fills.forEach((fill) => {
    total = total.plus(BigNumber(fill.price).times(fill.size));
    totalSize = totalSize.plus(fill.size);
  });
  return totalSize.gt(0) ? total.div(totalSize) : null;
};
