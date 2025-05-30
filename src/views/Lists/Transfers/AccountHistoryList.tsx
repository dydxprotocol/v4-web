import { useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { useAppSelector } from '@/state/appTypes';

import { AccountTransferRow } from './AccountTransferRow';

const TRANSFER_HEIGHT = 64;

export const AccountHistoryList = () => {
  const isLoading = useAppSelector(BonsaiCore.account.transfers.loading) === 'pending';
  const transfers = useAppSelector(BonsaiCore.account.transfers.data);
  const stringGetter = useStringGetter();
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

  if (transfers.length === 0) {
    return (
      <div tw="flex h-full w-full flex-col items-center justify-center">
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.TRANSFERS_EMPTY_STATE })}</div>
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
