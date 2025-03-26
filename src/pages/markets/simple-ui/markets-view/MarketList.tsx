import * as React from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import type { Range } from '@tanstack/react-virtual';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { STRING_KEYS } from '@/constants/localization';
import { MarketData, MarketFilters } from '@/constants/markets';

import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SearchInput } from '@/components/SearchInput';

import { useAppSelector } from '@/state/appTypes';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import { isPresent } from '@/lib/typeUtils';

import MarketRow from './MarketRow';
import PositionRow from './PositionRow';

type CustomItem = {
  itemType: 'custom';
  item: React.ReactNode;
};

type PositionItem = {
  itemType: 'position';
  item: SubaccountPosition;
};

type HeaderItem = {
  itemType: 'header';
  item: string;
};

type MarketItem = {
  itemType: 'market';
  item: MarketData;
};

type ListItem = PositionItem | HeaderItem | MarketItem | CustomItem;

const isPositionItem = (item: ListItem): item is PositionItem => {
  return item.itemType === 'position';
};

const isMarketItem = (item: ListItem): item is MarketItem => {
  return item.itemType === 'market';
};

const isCustomItem = (item: ListItem): item is CustomItem => {
  return item.itemType === 'custom';
};

const narrowListItemType = (item: ListItem) => {
  if (isPositionItem(item)) {
    return item;
  }

  if (isMarketItem(item)) {
    return item;
  }

  if (isCustomItem(item)) {
    return item;
  }

  return item;
};

const MarketList = ({ slotTop }: { slotTop?: React.ReactNode }) => {
  const stringGetter = useStringGetter();
  const filter: MarketFilters = useAppSelector(getMarketFilter);
  const [searchFilter, setSearchFilter] = React.useState<string>();
  const openPositions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const openPositionsLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.loading) === 'pending';

  const { filteredMarkets, hasMarketIds } = useMarketsData({
    filter,
    searchFilter,
  });

  const items: ListItem[] = React.useMemo(
    () => [
      ...(slotTop ? [{ itemType: 'custom' as const, item: slotTop }] : []),
      ...(openPositions?.length
        ? [
            {
              itemType: 'header' as const,
              item: stringGetter({ key: STRING_KEYS.YOUR_POSITIONS }),
            },
            ...openPositions.map((position) => ({
              itemType: 'position' as const,
              item: position,
            })),
          ]
        : []),
      { itemType: 'header' as const, item: stringGetter({ key: STRING_KEYS.MARKETS }) },
      ...filteredMarkets.map((market) => ({
        itemType: 'market' as const,
        item: market,
      })),
    ],
    [openPositions, filteredMarkets, stringGetter, slotTop]
  );

  const parentRef = React.useRef<HTMLDivElement>(null);

  const activeStickyIndexRef = React.useRef(0);

  const stickyIndexes = React.useMemo(
    () =>
      items.map((item, idx) => (item.itemType === 'header' ? idx : undefined)).filter(isPresent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length]
  );

  const isSticky = (index: number) => stickyIndexes.includes(index);

  const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize: (index: number) => (slotTop && index === 0 ? 320 : 60),
    getScrollElement: () => parentRef.current,
    rangeExtractor: React.useCallback(
      (range: Range) => {
        activeStickyIndexRef.current =
          [...stickyIndexes].reverse().find((index) => range.startIndex >= index) ?? 0;

        const next = new Set([activeStickyIndexRef.current, ...defaultRangeExtractor(range)]);

        return [...next].sort((a, b) => a - b);
      },
      [stickyIndexes]
    ),
  });

  if (!hasMarketIds || openPositionsLoading) {
    return <LoadingSpace id="markets-list" />;
  }

  return (
    <div ref={parentRef} tw="relative h-full max-h-full w-full max-w-full overflow-auto pb-6">
      <div
        tw="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            tw="left-0 top-0 w-full bg-color-layer-2"
            style={{
              ...(isSticky(virtualRow.index)
                ? {
                    zIndex: 1,
                  }
                : {}),
              ...(isActiveSticky(virtualRow.index)
                ? {
                    position: 'sticky',
                  }
                : {
                    position: 'absolute',
                    transform: `translateY(${virtualRow.start}px)`,
                  }),
              height: `${virtualRow.size}px`,
            }}
          >
            <ItemRenderer item={items[virtualRow.index]!} />
          </div>
        ))}
      </div>

      <div
        tw="fixed bottom-0 left-0 right-0 h-[5.5rem]"
        css={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
        }}
      >
        <SearchInput
          tw="mx-1.25 h-[3.25rem]"
          placeholder={stringGetter({ key: STRING_KEYS.SEARCH })}
          value={searchFilter}
          onTextChange={setSearchFilter}
        />
      </div>
    </div>
  );
};

const ItemRenderer = ({ item }: { item: ListItem }) => {
  const listItem = narrowListItemType(item);

  if (listItem.itemType === 'position') {
    return <PositionRow tw="h-[60px]" position={listItem.item} />;
  }

  if (listItem.itemType === 'market') {
    return <MarketRow tw="h-[60px]" market={listItem.item} />;
  }

  if (listItem.itemType === 'custom') {
    return <div tw="h-[320px]">{listItem.item}</div>;
  }

  return (
    <div tw="row h-[60px] bg-color-layer-2 px-1.25 text-color-text-2 font-medium-bold">
      {listItem.item}
    </div>
  );
};

export default MarketList;
