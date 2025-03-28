import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import type { Range } from '@tanstack/react-virtual';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import {
  CustomItem,
  ListItem,
  MarketItem,
  MarketsSortType,
  PositionItem,
} from '@/constants/marketList';
import { MarketData, MarketFilters } from '@/constants/markets';

import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';
import { SortIcon } from '@/components/SortIcon';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setMarketFilter } from '@/state/perpetuals';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import { isPresent } from '@/lib/typeUtils';

import MarketFilterRow from './MarketFilterRow';
import MarketRow from './MarketRow';
import PositionRow from './PositionRow';

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

const sortMarkets = (markets: MarketData[], sortType: MarketsSortType) => {
  return markets.sort((a, b) => {
    if (sortType === MarketsSortType.Price) {
      return (b.oraclePrice ?? 0) - (a.oraclePrice ?? 0);
    }

    if (sortType === MarketsSortType.Volume) {
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    }

    if (sortType === MarketsSortType.Gainers) {
      return (b.percentChange24h ?? 0) - (a.percentChange24h ?? 0);
    }

    if (sortType === MarketsSortType.Losers) {
      return (a.percentChange24h ?? 0) - (b.percentChange24h ?? 0);
    }

    return (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
  });
};

const POSITION_ROW_HEIGHT = 60;
const MARKET_ROW_HEIGHT = 60;
const HEADER_ROW_HEIGHT = 52;

const getItemHeight = (item: ListItem) => {
  const customHeight = item.customHeight;
  const itemType = item.itemType;

  if (itemType === 'custom') {
    if (customHeight == null) {
      throw new Error(`MarketList: ${item} has no custom height`);
    }

    return customHeight;
  }

  return (
    customHeight ??
    {
      position: POSITION_ROW_HEIGHT,
      market: MARKET_ROW_HEIGHT,
      header: HEADER_ROW_HEIGHT,
    }[itemType]
  );
};

const MarketList = ({
  slotTop,
}: {
  slotTop?: {
    content: ReactNode;
    height: number;
  };
}) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  // Filters and sort
  const filter: MarketFilters = useAppSelector(getMarketFilter);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<string>();
  const [sortType, setSortType] = useState<MarketsSortType>(MarketsSortType.Volume);

  // Markets and Filters
  const { filteredMarkets, hasMarketIds, marketFilters } = useMarketsData({
    filter: isSearchOpen ? filter : MarketFilters.ALL,
    searchFilter,
  });

  // Positions
  const openPositions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const openPositionsLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.loading) === 'pending';

  const setFilter = useCallback(
    (newFilter: MarketFilters) => {
      dispatch(setMarketFilter(newFilter));
    },
    [dispatch]
  );

  const onCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchFilter(undefined);
    setFilter(MarketFilters.ALL);
  }, [setFilter, setIsSearchOpen, setSearchFilter]);

  const sortedMarkets = sortMarkets(filteredMarkets, sortType);

  const sortItems = useMemo(
    () => [
      {
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        value: MarketsSortType.Price,
        active: sortType === MarketsSortType.Price,
        icon: <Icon iconName={IconName.Price} />,
        onSelect: () => setSortType(MarketsSortType.Price),
      },
      {
        label: stringGetter({ key: STRING_KEYS.VOLUME }),
        value: MarketsSortType.Volume,
        active: sortType === MarketsSortType.Volume,
        icon: <Icon iconName={IconName.Volume} />,
        onSelect: () => setSortType(MarketsSortType.Volume),
      },
      {
        label: stringGetter({ key: STRING_KEYS.GAINERS }),
        value: MarketsSortType.Gainers,
        active: sortType === MarketsSortType.Gainers,
        icon: <Icon iconName={IconName.TrendingUp} />,
        onSelect: () => setSortType(MarketsSortType.Gainers),
      },
      {
        label: stringGetter({ key: STRING_KEYS.LOSERS }),
        value: MarketsSortType.Losers,
        active: sortType === MarketsSortType.Losers,
        icon: <Icon iconName={IconName.TrendingDown} />,
        onSelect: () => setSortType(MarketsSortType.Losers),
      },
      {
        label: stringGetter({ key: STRING_KEYS.FAVORITES }),
        value: MarketsSortType.Favorites,
        active: sortType === MarketsSortType.Favorites,
        icon: <Icon iconName={IconName.Star} />,
        onSelect: () => setSortType(MarketsSortType.Favorites),
      },
    ],
    [stringGetter, sortType]
  );

  const searchViewItems: ListItem[] = useMemo(
    () => [
      {
        itemType: 'custom' as const,
        item: (
          <MarketFilterRow
            filter={filter}
            marketFilters={marketFilters}
            onCloseSearch={onCloseSearch}
            setFilter={setFilter}
            setSearchFilter={setSearchFilter}
            sortItems={sortItems}
            sortTypeLabel={sortItems.find((item) => item.value === sortType)?.label ?? ''}
          />
        ),
        isSticky: true,
        customHeight: 180,
      },
      ...sortedMarkets.map((market) => ({
        itemType: 'market' as const,
        item: market,
      })),
    ],
    [
      sortedMarkets,
      filter,
      marketFilters,
      onCloseSearch,
      setFilter,
      setSearchFilter,
      sortItems,
      sortType,
    ]
  );

  const defaultViewItems: ListItem[] = useMemo(
    () => [
      ...(slotTop
        ? [{ itemType: 'custom' as const, item: slotTop.content, customHeight: slotTop.height }]
        : []),
      ...(openPositions?.length
        ? [
            {
              itemType: 'header' as const,
              item: stringGetter({ key: STRING_KEYS.YOUR_POSITIONS }),
              isSticky: true,
            },
            ...openPositions.map((position) => ({
              itemType: 'position' as const,
              item: position,
            })),
          ]
        : []),
      {
        itemType: 'header' as const,
        item: stringGetter({ key: STRING_KEYS.MARKETS }),
        isSticky: true,
        slotRight: (
          <div tw="row gap-0.5">
            <span tw="text-color-text-0 font-small-book">
              {sortItems.find((item) => item.value === sortType)?.label}
            </span>
            <SimpleUiDropdownMenu
              align="end"
              tw="z-1"
              items={sortItems}
              slotTop={<span tw="text-color-text-0 font-small-book">Sort by</span>}
            >
              <Button tw="size-2 min-w-2" shape={ButtonShape.Circle} size={ButtonSize.XXSmall}>
                <SortIcon />
              </Button>
            </SimpleUiDropdownMenu>
          </div>
        ),
      },
      ...sortedMarkets.map((market) => ({
        itemType: 'market' as const,
        item: market,
      })),
    ],
    [openPositions, sortedMarkets, stringGetter, slotTop, sortItems]
  );

  const items = useMemo(() => {
    return isSearchOpen ? searchViewItems : defaultViewItems;
  }, [isSearchOpen, searchViewItems, defaultViewItems]);

  const parentRef = useRef<HTMLDivElement>(null);

  const activeStickyIndexRef = useRef(0);

  const stickyIndexes = useMemo(
    () => items.map((item, idx) => (item.isSticky ? idx : undefined)).filter(isPresent),
    [items]
  );

  const isSticky = (index: number) => stickyIndexes.includes(index);

  const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize: (index: number) => getItemHeight(items[index]!),
    getScrollElement: () => parentRef.current,
    rangeExtractor: useCallback(
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
    <div
      ref={parentRef}
      tw="relative h-full max-h-full w-full max-w-full overflow-auto"
      css={{
        paddingBottom: isSearchOpen ? '1rem' : '6rem',
      }}
    >
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
        tw="fixed bottom-0 left-0 right-0 flex h-[5.5rem]"
        css={{
          display: isSearchOpen ? 'none' : 'flex',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
        }}
      >
        <button
          type="button"
          aria-label="Search"
          tw="p-[0 0.75rem] row mx-1.25 h-[3.25rem] w-auto flex-1 cursor-pointer gap-0.5 rounded-[2.5rem] bg-color-layer-5 text-color-text-0 font-base-book"
          onClick={() => setIsSearchOpen(true)}
        >
          <Icon tw="scale-x-[-1] scale-y-[1]" iconName={IconName.Search} />
          <span>{stringGetter({ key: STRING_KEYS.SEARCH })}...</span>
        </button>
      </div>
    </div>
  );
};

const ItemRenderer = ({ item }: { item: ListItem }) => {
  const listItem = narrowListItemType(item);
  const height = getItemHeight(item);

  if (listItem.itemType === 'position') {
    return <PositionRow css={{ height }} position={listItem.item} />;
  }

  if (listItem.itemType === 'market') {
    return <MarketRow css={{ height }} market={listItem.item} />;
  }

  if (listItem.itemType === 'custom') {
    return <div css={{ height }}>{listItem.item}</div>;
  }

  return (
    <div
      tw="flex flex-row items-end justify-between bg-color-layer-2 px-1.25 pb-[0.75rem] text-color-text-2 font-medium-bold"
      css={{ height }}
    >
      {listItem.item}
      {listItem.slotRight}
    </div>
  );
};

export default MarketList;
