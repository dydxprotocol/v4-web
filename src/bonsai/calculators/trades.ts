import { keyBy, maxBy, orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { EMPTY_ARR } from '@/constants/objects';
import {
  IndexerOrderSide,
  IndexerOrderType,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';
import {
  IndexerCompositeTradeHistoryObject,
  IndexerTradeAction,
} from '@/types/indexer/indexerManual';

import { MustBigNumber, MustNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';
import { logBonsaiError } from '../logs';
import { SubaccountTrade, TradeAction } from '../types/summaryTypes';

export function calculateTrades(
  restTrades: IndexerCompositeTradeHistoryObject[] | undefined,
  liveTrades: IndexerCompositeTradeHistoryObject[] | undefined
): SubaccountTrade[] {
  const getTradesById = (data: IndexerCompositeTradeHistoryObject[]) => {
    const tradesWithIds = data.filter(
      (trade): trade is IndexerCompositeTradeHistoryObject & { id: string } => {
        if (!trade.id) {
          logBonsaiError('calculateTrades', 'Trade missing id, skipping', { trade });
          return false;
        }
        return true;
      }
    );
    return keyBy(tradesWithIds, (trade) => trade.id!);
  };

  const merged = mergeObjects(
    getTradesById(restTrades ?? EMPTY_ARR),
    getTradesById(liveTrades ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (t) => MustBigNumber(t.time).toNumber())!
  );

  return orderBy(Object.values(merged).map(calculateTrade), [(t) => t.createdAt], ['desc']);
}

const calculateTrade = weakMapMemoize(
  (base: IndexerCompositeTradeHistoryObject): SubaccountTrade => ({
    id: base.id ?? '',
    marketId: base.marketId ?? '',
    orderId: base.orderId,
    positionUniqueId: undefined,
    side: base.side as IndexerOrderSide | undefined,
    positionSide: base.positionSide as IndexerPositionSide | null | undefined,
    action: deriveTradeAction(base),
    price: Number(base.executionPrice),
    entryPrice: base.entryPrice ? Number(base.entryPrice) : undefined,
    size: MustNumber(base.additionalSize ?? 0),
    prevSize: base.prevSize ? Number(base.prevSize) : undefined,
    additionalSize: base.additionalSize ? Number(base.additionalSize) : undefined,
    value: MustNumber(base.value ?? 0),
    fee: base.netFee,
    closedPnl: base.netRealizedPnl != null ? MustNumber(base.netRealizedPnl) : undefined,
    closedPnlPercent: derivePerTradePnlPercent(base),
    netClosedPnlPercent:
      base.netRealizedPnlPercent != null ? MustNumber(base.netRealizedPnlPercent) : undefined,
    createdAt: base.time,
    marginMode: base.marginMode === 'ISOLATED' ? 'ISOLATED' : 'CROSS',
    orderType: base.orderType as IndexerOrderType | undefined,
    subaccountNumber: base.subaccountNumber,
  })
);

function deriveTradeAction(trade: IndexerCompositeTradeHistoryObject): TradeAction {
  const isLong =
    trade.positionSide === IndexerPositionSide.LONG ||
    (trade.side === IndexerOrderSide.BUY && trade.action === 'OPEN');
  const isExtend = trade.action === 'EXTEND';
  const isBuy = trade.side === IndexerOrderSide.BUY;
  const isLiquidated =
    trade.action === 'LIQUIDATION_CLOSE' || trade.action === 'LIQUIDATION_PARTIAL_CLOSE';

  if (isLiquidated) {
    return TradeAction.LIQUIDATION;
  }

  if (trade.action === IndexerTradeAction.PARTIAL_CLOSE) {
    return isBuy ? TradeAction.PARTIAL_CLOSE_SHORT : TradeAction.PARTIAL_CLOSE_LONG;
  }

  if (isExtend) {
    return isLong ? TradeAction.ADD_TO_LONG : TradeAction.ADD_TO_SHORT;
  }

  if (trade.action === IndexerTradeAction.CLOSE) {
    return trade.side === IndexerOrderSide.SELL || isLong
      ? TradeAction.CLOSE_LONG
      : TradeAction.CLOSE_SHORT;
  }

  return trade.action === IndexerTradeAction.OPEN && (trade.side === IndexerOrderSide.BUY || isLong)
    ? TradeAction.OPEN_LONG
    : TradeAction.OPEN_SHORT;
}

function derivePerTradePnlPercent(trade: IndexerCompositeTradeHistoryObject): number | undefined {
  if (!trade.entryPrice || !trade.executionPrice) {
    return undefined;
  }

  const entryPrice = MustNumber(trade.entryPrice);
  const executionPrice = MustNumber(trade.executionPrice);
  const pnl =
    trade.positionSide === IndexerPositionSide.LONG
      ? executionPrice - entryPrice
      : entryPrice - executionPrice;
  const pnlPercent = pnl / entryPrice;
  return pnlPercent;
}
