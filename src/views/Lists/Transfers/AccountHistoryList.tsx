import { useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { useAppSelector } from '@/state/appTypes';

import { AccountTransferRow } from './AccountTransferRow';

const TRANSFER_HEIGHT = 64;

export const AccountHistoryList = () => {
  const isLoading = useAppSelector(BonsaiCore.account.transfers.loading) === 'pending';
  const transfers = useAppSelector(BonsaiCore.account.transfers.data);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transfers.length,
    estimateSize: (_index: number) => TRANSFER_HEIGHT,
    getScrollElement: () => parentRef.current,
    rangeExtractor: (range) => {
      return [...new Set([0, ...defaultRangeExtractor(range)])];
    },
  });

  if (isLoading) {
    return <LoadingSpace id="trade-history-list" />;
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
            <AccountTransferRow
              css={{ height: `${virtualRow.size}px` }}
              transfer={transfers[virtualRow.index]!}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
