import { useRef } from 'react';

import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { EMPTY_ARR } from '@/constants/objects';

import { useLoadedVaultAccount, useLoadedVaultAccountTransfers } from '@/hooks/vaultsHooks';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { VaultTransferRow } from './VaultTransferRow';

const TRANSFER_HEIGHT = 64;

export const VaultTransferList = () => {
  const isLoading = useLoadedVaultAccount().isLoading;
  const vaultTransfers = useLoadedVaultAccountTransfers() ?? EMPTY_ARR;

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: vaultTransfers.length,
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
            <VaultTransferRow
              css={{ height: `${virtualRow.size}px` }}
              vaultTransfer={vaultTransfers[virtualRow.index]!}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
