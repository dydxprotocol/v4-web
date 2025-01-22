import { OrderbookData } from '../types/rawTypes';
import { OrderbookProcessedData } from '../types/summaryTypes';

export const calculateOrderbook = (
  orderbook: OrderbookData,
  groupingMultiplier: number
): OrderbookProcessedData => {
  const { asks, bids } = orderbook;

  // Sort by price level and un-cross orderbook
  const groupedAsks = groupOrders(asks, groupingMultiplier);
  const groupedBids = groupOrders(bids, groupingMultiplier);

  // multiply by groupingMultiplier

  return {
    asks: groupedAsks,
    bids: groupedBids,
    spread: 0,
    spreadPercent: 0,
  };
};
