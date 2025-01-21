import { OrderStatus } from '@/abacus-ts/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';

export function getOrderStatusStringKey(status: OrderStatus | undefined): string {
  if (!status) return STRING_KEYS.PENDING;

  switch (status) {
    case OrderStatus.Open:
      return STRING_KEYS.OPEN_STATUS;
    case OrderStatus.Canceled:
      return STRING_KEYS.CANCELED;
    case OrderStatus.Canceling:
      return STRING_KEYS.CANCELING;
    case OrderStatus.Filled:
      return STRING_KEYS.ORDER_FILLED;
    case OrderStatus.Pending:
      return STRING_KEYS.PENDING;
    case OrderStatus.Untriggered:
      return STRING_KEYS.UNTRIGGERED;
    case OrderStatus.PartiallyFilled:
      return STRING_KEYS.PARTIALLY_FILLED;
    case OrderStatus.PartiallyCanceled:
      return STRING_KEYS.PARTIALLY_FILLED;
    default:
      assertNever(status);
      return STRING_KEYS.PENDING;
  }
}

export function getIndexerOrderTypeStringKey(type: IndexerOrderType): string {
  switch (type) {
    case IndexerOrderType.MARKET:
      return STRING_KEYS.MARKET_ORDER_SHORT;
    case IndexerOrderType.STOPLIMIT:
      return STRING_KEYS.STOP_LIMIT;
    case IndexerOrderType.STOPMARKET:
      return STRING_KEYS.STOP_MARKET;
    case IndexerOrderType.LIMIT:
      return STRING_KEYS.LIMIT_ORDER_SHORT;
    case IndexerOrderType.TRAILINGSTOP:
      return STRING_KEYS.TRAILING_STOP;
    case IndexerOrderType.TAKEPROFIT:
      return STRING_KEYS.TAKE_PROFIT_LIMIT_SHORT;
    case IndexerOrderType.TAKEPROFITMARKET:
      return STRING_KEYS.TAKE_PROFIT_MARKET_SHORT;
    default:
      assertNever(type);
      return STRING_KEYS.LIMIT_ORDER_SHORT;
  }
}

export function getIndexerOrderSideStringKey(side: IndexerOrderSide): string {
  if (side === IndexerOrderSide.BUY) {
    return STRING_KEYS.BUY;
  }
  return STRING_KEYS.SELL;
}
