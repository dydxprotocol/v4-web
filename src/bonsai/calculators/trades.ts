import { keyBy, maxBy, orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';
import { IndexerCompositeTradeObject } from '@/types/indexer/indexerManual';

import { MustBigNumber, MustNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';
import { SubaccountTrade, TradeAction } from '../types/summaryTypes';

export function calculateTrades(
  restTrades: IndexerCompositeTradeObject[] | undefined,
  liveTrades: IndexerCompositeTradeObject[] | undefined
): SubaccountTrade[] {
  const getTradesById = (data: IndexerCompositeTradeObject[]) =>
    keyBy(data, (trade) => trade.id ?? '');

  const merged = mergeObjects(
    getTradesById(restTrades ?? EMPTY_ARR),
    getTradesById(liveTrades ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (t) => MustBigNumber(t.time).toNumber())!
  );

  return orderBy(Object.values(merged).map(calculateTrade), [(t) => t.createdAt], ['desc']);
}

const calculateTrade = weakMapMemoize(
  (base: IndexerCompositeTradeObject): SubaccountTrade => ({
    id: base.id ?? '',
    marketId: base.marketId ?? '',
    positionId: base.positionId ?? '',
    orderId: base.orderId ?? '',
    side: base.side,
    action: deriveTradeAction(base),
    price: base.executionPrice,
    size: (MustNumber(base.additionalSize ?? 0) + MustNumber(base.prevSize ?? 0)).toString(),
    value:
      MustNumber(base.executionPrice ?? 0) * MustNumber(base.additionalSize ?? 0) +
      MustNumber(base.prevSize ?? '0'),
    fee: base.netFee,
    closedPnl: base.netRealizedPnl != null ? MustNumber(base.netRealizedPnl) : undefined,
    closedPnlPercent:
      base.netRealizedPnl != null
        ? MustNumber(base.netRealizedPnl) /
          (Math.abs(MustNumber(base.additionalSize ?? 0)) * MustNumber(base.executionPrice ?? 0))
        : undefined,
    createdAt: base.time,
    marginMode: base.marginMode === 'ISOLATED' ? 'ISOLATED' : 'CROSS',
    orderType: undefined, // map from base.orderType when API contract is known
  })
);

function deriveTradeAction(trade: IndexerCompositeTradeObject): TradeAction {
  // If the API sends `action` directly, use it:
  // if (trade.action) return trade.action as TradeAction;

  // Otherwise derive from position context (same logic you had):
  const positionSizeBefore = MustNumber(trade.prevSize ?? '0');
  const tradeSize = MustNumber(trade.additionalSize ?? 0) + MustNumber(trade.prevSize ?? 0);
  const isLong =
    trade.positionSide === IndexerPositionSide.LONG ||
    (trade.side === IndexerOrderSide.BUY && trade.action === 'OPEN');
  const isExtend = trade.action === 'EXTEND';
  const isBuy = trade.side === IndexerOrderSide.BUY;

  if (positionSizeBefore === 0) {
    return isBuy ? TradeAction.OPEN_LONG : TradeAction.OPEN_SHORT;
  }

  if ((isExtend && isBuy) || (isExtend && !isBuy)) {
    return isLong ? TradeAction.ADD_TO_LONG : TradeAction.ADD_TO_SHORT;
  }

  const isFullClose = tradeSize >= positionSizeBefore;
  if (isLong) {
    return isFullClose ? TradeAction.CLOSE_LONG : TradeAction.PARTIAL_CLOSE_LONG;
  }
  return isFullClose ? TradeAction.CLOSE_SHORT : TradeAction.PARTIAL_CLOSE_SHORT;
}
