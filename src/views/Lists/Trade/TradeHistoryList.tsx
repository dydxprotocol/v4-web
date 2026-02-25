import { useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { useAppSelector } from '@/state/appTypes';

import { TradeHistoryRow } from './TradeHistoryRow';

const FILL_HEIGHT = 64;

export const TradeHistoryList = () => {
  const loadingStatus = useAppSelector(BonsaiCore.account.tradeHistory.loading);
  const trades = useAppSelector(BonsaiCore.account.tradeHistory.data);
  const parentRef = useRef<HTMLDivElement>(null);
  const stringGetter = useStringGetter();

  const isLoading = loadingStatus === 'pending';
  const isError = loadingStatus === 'error';

  const rowVirtualizer = useVirtualizer({
    count: trades.length,
    estimateSize: (_index: number) => FILL_HEIGHT,
    getScrollElement: () => parentRef.current,
    rangeExtractor: (range) => {
      return [...new Set([0, ...defaultRangeExtractor(range)])];
    },
  });

  if (isError) {
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

  if (trades.length === 0) {
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
