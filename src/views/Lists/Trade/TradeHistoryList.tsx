import { useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SubaccountFillType, SubaccountTrade, TradeAction } from '@/bonsai/types/summaryTypes';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { useAppSelector } from '@/state/appTypes';

// import { TradeRow } from './TradeRow';
import { TradeHistoryRow } from './TradeHistoryRow';

const FILL_HEIGHT = 64;

const MOCK_TRADES: SubaccountTrade[] = [
  // --- L → Close scenario ---
  {
    id: 'trade-001',
    market: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.CLOSE_LONG,
    price: '5000.00',
    size: '10.05',
    value: 50250,
    fee: '0.10',
    closedPnl: -20293.09,
    closedPnlPercent: -0.0404,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
  },
  {
    id: 'trade-002',
    market: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
  },
  // --- L → S (crossing 0) scenario ---
  {
    id: 'trade-003',
    market: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.SHORT,
    action: TradeAction.OPEN_SHORT,
    price: '3000.00',
    size: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
  },
  {
    id: 'trade-004',
    market: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.CLOSE_LONG,
    price: '3000.00',
    size: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: 20293.09,
    closedPnlPercent: 0.0404,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
  },
  {
    id: 'trade-005',
    market: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.05',
    value: 30150,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
  },
  // --- L → Partial Close scenario ---
  {
    id: 'trade-006',
    market: 'ETH-USD',
    side: IndexerOrderSide.SELL,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.PARTIAL_CLOSE_LONG,
    price: '5000.00',
    size: '5.00',
    value: 25000,
    fee: '0.10',
    closedPnl: 5293.09,
    closedPnlPercent: 0.0212,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.MARKET,
    leverage: 10,
  },
  {
    id: 'trade-007',
    market: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.00',
    value: 30000,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
  },

  // --- Add to Long scenario ---
  {
    id: 'trade-008',
    market: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.ADD_TO_LONG,
    price: '3000.00',
    size: '5.00',
    value: 15000,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
  },
  {
    id: 'trade-009',
    market: 'ETH-USD',
    side: IndexerOrderSide.BUY,
    positionSide: IndexerPositionSide.LONG,
    action: TradeAction.OPEN_LONG,
    price: '3000.00',
    size: '10.00',
    value: 30000,
    fee: '0.10',
    closedPnl: undefined,
    closedPnlPercent: undefined,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    marginMode: 'CROSS',
    orderType: SubaccountFillType.LIMIT,
    leverage: 10,
  },
];

export const TradeHistoryList = () => {
  const isLoading = useAppSelector(BonsaiCore.account.fills.loading) === 'pending';
  // const fills = useAppSelector(BonsaiCore.account.fills.data);
  // const trades = useAppSelector(BonsaiCore.account.trades.data);
  const trades = MOCK_TRADES;
  const parentRef = useRef<HTMLDivElement>(null);
  const stringGetter = useStringGetter();

  const rowVirtualizer = useVirtualizer({
    count: trades.length,
    estimateSize: (_index: number) => FILL_HEIGHT,
    getScrollElement: () => parentRef.current,
    rangeExtractor: (range) => {
      return [...new Set([0, ...defaultRangeExtractor(range)])];
    },
  });

  if (isLoading) {
    return <LoadingSpace id="trade-history-list" />;
  }

  if (trades.length === 0) {
    return (
      <div tw="flex h-full w-full flex-col items-center justify-center">
        {/* TODO: DWJ -- Replace with real trades empty state */}
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.FILLS_EMPTY_STATE })}</div>
      </div>
    );
  }
  return (
    <div ref={parentRef} tw="relative h-full max-h-full w-full max-w-full overflow-auto">
      <div
        tw="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            tw="row left-0 top-0 w-full bg-color-layer-2"
            style={{
              height: `${virtualRow.size}px`,
              position: 'absolute',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TradeHistoryRow
              css={{ height: `${virtualRow.size}px` }}
              trade={trades[virtualRow.index]!}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
