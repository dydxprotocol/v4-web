import { DateTime } from 'luxon';

import { STRING_KEYS } from '@/constants/localization';

import {
  AbacusOrderStatus,
  AbacusOrderType,
  AbacusOrderTypes,
  type Asset,
  type SubaccountFill,
  type SubaccountFundingPayment,
  type SubaccountOrder,
  type Nullable,
  type OrderStatus,
  type PerpetualMarket,
} from '@/constants/abacus';

import { IconName } from '@/components/Icon';

import { convertAbacusOrderSide } from '@/lib/abacus/conversions';
import { MustBigNumber } from '@/lib/numbers';

export const getStatusIconInfo = ({
  status,
  totalFilled,
}: {
  status: OrderStatus;
  totalFilled: Nullable<number>;
}) => {
  switch (status) {
    case AbacusOrderStatus.open: {
      return MustBigNumber(totalFilled).gt(0)
        ? {
            statusIcon: IconName.OrderPartiallyFilled,
            statusIconColor: `var(--color-warning)`,
            statusStringKey: STRING_KEYS.PARTIALLY_FILLED,
          }
        : {
            statusIcon: IconName.OrderOpen,
            statusIconColor: `var(--color-text-2)`,
          };
    }
    case AbacusOrderStatus.filled: {
      return {
        statusIcon: IconName.OrderFilled,
        statusIconColor: `var(--color-positive)`,
      };
    }
    case AbacusOrderStatus.cancelled: {
      return {
        statusIcon: IconName.OrderCanceled,
        statusIconColor: `var(--color-negative)`,
      };
    }
    case AbacusOrderStatus.canceling: {
      return {
        statusIcon: IconName.OrderPending,
        statusIconColor: `var(--color-negative)`,
      };
    }
    case AbacusOrderStatus.untriggered: {
      return {
        statusIcon: IconName.OrderUntriggered,
        statusIconColor: `var(--color-text-2)`,
      };
    }
    case AbacusOrderStatus.pending:
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
  asset: assets && perpetualMarkets && assets[perpetualMarkets[data.marketId].assetId],
  stepSizeDecimals: perpetualMarkets?.[data.marketId].configs?.stepSizeDecimals,
  tickSizeDecimals: perpetualMarkets?.[data.marketId].configs?.tickSizeDecimals,
  ...('side' in data && { orderSide: convertAbacusOrderSide(data.side) }),
});
