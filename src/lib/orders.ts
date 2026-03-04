// eslint-disable-next-line no-restricted-imports
import { getSimpleOrderStatus } from '@/bonsai/calculators/orders';
import {
  SubaccountOrder as NewSubaccountOrder,
  OrderStatus as OrderStatusNew,
  PerpetualMarketSummaries,
  PerpetualMarketSummary,
  SubaccountFill as SubaccountFillNew,
} from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';

import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { IconName } from '@/components/Icon';

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

export const isNewOrderStatusClearable = (status: OrderStatusNew) =>
  getSimpleOrderStatus(status) === OrderStatusNew.Canceled ||
  getSimpleOrderStatus(status) === OrderStatusNew.Filled;

export const isNewOrderStatusCanceled = (status: OrderStatusNew) =>
  getSimpleOrderStatus(status) === OrderStatusNew.Canceled;

export const isMarketOrderTypeNew = (type?: IndexerOrderType) =>
  type &&
  [
    IndexerOrderType.MARKET,
    IndexerOrderType.STOPMARKET,
    IndexerOrderType.TAKEPROFITMARKET,
    IndexerOrderType.TRAILINGSTOP,
  ].includes(type);

export const isLimitOrderTypeNew = (type?: IndexerOrderType) =>
  type &&
  [IndexerOrderType.LIMIT, IndexerOrderType.STOPLIMIT, IndexerOrderType.TAKEPROFIT].includes(type);

export const isStopLossOrderNew = (
  order: NewSubaccountOrder,
  isSlTpLimitOrdersEnabled: boolean
) => {
  const validOrderTypes = isSlTpLimitOrdersEnabled
    ? [IndexerOrderType.STOPLIMIT, IndexerOrderType.STOPMARKET]
    : [IndexerOrderType.STOPMARKET];
  return order.reduceOnly && validOrderTypes.includes(order.type);
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

export const isSellOrderNew = (order: NewSubaccountOrder) => {
  return order.side === IndexerOrderSide.SELL;
};

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

export const getAverageFillPrice = (fills: SubaccountFillNew[]) => {
  let total = BigNumber(0);
  let totalSize = BigNumber(0);
  fills.forEach((fill) => {
    total = total.plus(BigNumber(fill.price ?? 0).times(fill.size ?? 0));
    totalSize = totalSize.plus(fill.size ?? 0);
  });
  return totalSize.gt(0) ? total.div(totalSize) : null;
};
