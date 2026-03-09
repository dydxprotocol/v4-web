import { useMemo, useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { useAppSelector } from '@/state/appTypes';

import { TradeHistoryRow } from './TradeHistoryRow';
import { TradeRow } from './TradeRow';

const FILL_HEIGHT = 64;

export const TradeHistoryList = () => {
  const loadingStatusTrades = useAppSelector(BonsaiCore.account.tradeHistory.loading);
  const loadingStatusFills = useAppSelector(BonsaiCore.account.fills.loading);
  const trades = useAppSelector(BonsaiCore.account.tradeHistory.data);
  const fills = useAppSelector(BonsaiCore.account.fills.data);

  const parentRef = useRef<HTMLDivElement>(null);
  const stringGetter = useStringGetter();

  const isLoading = loadingStatusTrades === 'pending' && loadingStatusFills === 'pending';
  const isTradesError = loadingStatusTrades === 'error';
  const isError = isTradesError || loadingStatusFills === 'error';

  const tradesToDisplay = useMemo(() => {
    if ((isTradesError && !isLoading) || trades.length === 0) {
      return fills;
    }
    return trades;
  }, [isTradesError, isLoading, trades, fills]);

  const rowVirtualizer = useVirtualizer({
    count: tradesToDisplay.length,
    estimateSize: (_index: number) => FILL_HEIGHT,
    getScrollElement: () => parentRef.current,
    rangeExtractor: (range) => {
      return [...new Set([0, ...defaultRangeExtractor(range)])];
    },
  });

  if (isError && !isLoading && tradesToDisplay.length === 0) {
    return (
      <div tw="flex h-full w-full flex-col items-center justify-center gap-3">
        <div tw="text-color-text-0">
          {stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: { ERROR_MESSAGE: 'Failed to load trades' },
          })}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpace id="trade-history-list" />;
  }

  if (tradesToDisplay.length === 0) {
    return (
      <div tw="flex h-full w-full flex-col items-center justify-center">
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.TRADES_EMPTY_STATE })}</div>
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
            {trades.length !== 0 ? (
              <TradeHistoryRow
                css={{ height: `${virtualRow.size}px` }}
                trade={trades[virtualRow.index]!}
              />
            ) : (
              <TradeRow css={{ height: `${virtualRow.size}px` }} fill={fills[virtualRow.index]!} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
