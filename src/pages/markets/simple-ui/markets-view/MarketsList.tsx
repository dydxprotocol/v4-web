import { useEffect, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List, ListOnScrollProps } from 'react-window';

import { STRING_KEYS } from '@/constants/localization';
import { MarketData, MarketFilters } from '@/constants/markets';

import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SearchInput } from '@/components/SearchInput';

import { useAppSelector } from '@/state/appTypes';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import MarketRow from './MarketRow';
import PositionRow from './PositionRow';

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

type ListItem = PositionItem | HeaderItem | MarketItem;

const isPositionItem = (item: ListItem): item is PositionItem => {
  return item.itemType === 'position';
};

const isMarketItem = (item: ListItem): item is MarketItem => {
  return item.itemType === 'market';
};

const narrowListItemType = (index: number, items: ListItem[]) => {
  const listItem = items[index];
  if (!listItem) {
    throw new Error(`Item does not exist at index ${index}`);
  }

  if (isPositionItem(listItem)) {
    return listItem;
  }

  if (isMarketItem(listItem)) {
    return listItem;
  }

  return listItem;
};

export const MarketsList = ({ onScroll }: { onScroll?: (props: ListOnScrollProps) => void }) => {
  const stringGetter = useStringGetter();
  const filter: MarketFilters = useAppSelector(getMarketFilter);
  const [searchFilter, setSearchFilter] = useState<string>();
  const openPositions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const openPositionsLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.loading) === 'pending';

  const { filteredMarkets, hasMarketIds } = useMarketsData({
    filter,
    searchFilter,
  });

  const [scrollPosition, setScrollPosition] = useState(0);
  const [stickyLabel, setStickyLabel] = useState('');

  const items: ListItem[] = useMemo(
    () => [
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
    [openPositions, filteredMarkets, stringGetter]
  );

  const labelPosition = useMemo(
    () => ({
      positionLabelOffset: openPositions?.length ? 60 : 0,
      marketLabelOffset: openPositions?.length ? (openPositions.length + 2) * 60 : 60,
    }),
    [openPositions?.length]
  );

  useEffect(() => {
    if (scrollPosition < labelPosition.positionLabelOffset) {
      setStickyLabel('');
    } else if (scrollPosition < labelPosition.marketLabelOffset) {
      if (labelPosition.positionLabelOffset < 1) {
        setStickyLabel('');
      } else {
        setStickyLabel(stringGetter({ key: STRING_KEYS.YOUR_POSITIONS }));
      }
    } else {
      setStickyLabel(stringGetter({ key: STRING_KEYS.MARKETS }));
    }
  }, [scrollPosition, labelPosition, stringGetter]);

  if (!hasMarketIds || openPositionsLoading) {
    return <LoadingSpace id="markets-list" />;
  }

  const getItemKey = (index: number) => {
    const listItem = items[index];
    if (!listItem) {
      throw new Error(`Item does not exist at index ${index}`);
    }

    if (isPositionItem(listItem)) {
      return `position-${listItem.item.uniqueId}`;
    }

    if (isMarketItem(listItem)) {
      return `market-${listItem.item.id}`;
    }

    return `header-${listItem.item}`;
  };

  return (
    <div tw="relative h-full w-full">
      {stickyLabel && <div tw="row h-[3.75rem] px-1.25 font-small-bold">{stickyLabel}</div>}{' '}
      <AutoSizer>
        {({ width, height }) => (
          <List
            tw="pb-[8.75rem]"
            itemCount={items.length}
            width={width}
            height={height}
            itemSize={() => 60}
            onScroll={(listOnScrollProps: ListOnScrollProps) => {
              setScrollPosition(listOnScrollProps.scrollOffset);
              onScroll?.(listOnScrollProps);
            }}
            itemKey={getItemKey}
          >
            {({ index, style }) => {
              const listItem = narrowListItemType(index, items);

              if (listItem.itemType === 'position') {
                return <PositionRow position={listItem.item} style={style} />;
              }

              if (listItem.itemType === 'market') {
                return <MarketRow market={listItem.item} style={style} />;
              }

              return (
                <div tw="row px-1.25 font-small-bold" style={style}>
                  {listItem.item}
                </div>
              );
            }}
          </List>
        )}
      </AutoSizer>
      <div
        tw="fixed bottom-0 left-0 right-0 h-[4.5rem]"
        css={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
        }}
      >
        <SearchInput
          tw="mx-1.25"
          placeholder="Search"
          value={searchFilter}
          onTextChange={setSearchFilter}
        />
      </div>
    </div>
  );
};
