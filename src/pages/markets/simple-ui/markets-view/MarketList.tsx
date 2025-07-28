import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import type { Range } from '@tanstack/react-virtual';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import BigNumber from 'bignumber.js';
import orderBy from 'lodash/orderBy';

import { ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ListItem, MarketsSortType, PositionSortType } from '@/constants/marketList';
import { MarketData, MarketFilters } from '@/constants/markets';
import { EMPTY_ARR } from '@/constants/objects';

import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';
import { SortIcon } from '@/components/SortIcon';

import { getSubaccountEquity } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSimpleUISortMarketsBy, setSimpleUISortPositionsBy } from '@/state/appUiConfigs';
import {
  getSimpleUISortMarketsBy,
  getSimpleUISortPositionsBy,
} from '@/state/appUiConfigsSelectors';
import { setMarketFilter } from '@/state/perpetuals';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import { isPresent } from '@/lib/typeUtils';

import MarketFilterRow from './MarketFilterRow';
import { MarketRow } from './MarketRow';
import { PositionRow } from './PositionRow';

const sortMarkets = (markets: MarketData[], sortType: MarketsSortType) => {
  switch (sortType) {
    case MarketsSortType.MarketCap:
      return orderBy(markets, (market) => market.marketCap ?? 0, ['desc']);
    case MarketsSortType.Volume:
      return orderBy(markets, (market) => market.volume24h ?? 0, ['desc']);
    case MarketsSortType.Gainers:
      return orderBy(markets, (market) => market.percentChange24h ?? 0, ['desc']);
    case MarketsSortType.Losers:
      return orderBy(markets, (market) => market.percentChange24h ?? 0, ['asc']);
    case MarketsSortType.Favorites:
      return orderBy(markets, (market) => market.isFavorite, ['desc']);
    default:
      return markets;
  }
};

const sortPositions = (
  positions: SubaccountPosition[],
  marketData: MarketData[],
  subaccountEquity: number | undefined,
  sortType: PositionSortType
) => {
  switch (sortType) {
    case PositionSortType.Notional:
      return orderBy(positions, (position) => position.notional.toNumber(), ['desc']);
    case PositionSortType.Pnl:
      return orderBy(
        positions,
        (position) => position.updatedUnrealizedPnlPercent?.toNumber() ?? 0,
        ['desc']
      );
    case PositionSortType.Leverage: {
      const getMarginUsage = (marginValueInitial: BigNumber) =>
        subaccountEquity != null && subaccountEquity !== 0
          ? marginValueInitial.div(subaccountEquity).toNumber()
          : undefined;

      return orderBy(positions, (position) => getMarginUsage(position.marginValueInitial) ?? 0, [
        'desc',
      ]);
    }
    case PositionSortType.Price:
      return orderBy(
        positions,
        (position) => {
          const marketCap = marketData.find((market) => market.id === position.market)?.marketCap;
          return marketCap ?? 0;
        },
        ['desc']
      );
    default:
      return positions;
  }
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

export const MarketList = ({
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
  const sortType = useAppSelector(getSimpleUISortMarketsBy);
  const positionSortType = useAppSelector(getSimpleUISortPositionsBy);
  const subaccountEquity = useAppSelector(getSubaccountEquity);

  const setSortType = useCallback(
    (newSortType: MarketsSortType) => {
      dispatch(setSimpleUISortMarketsBy(newSortType));
    },
    [dispatch]
  );

  // Markets and Filters
  const { filteredMarkets, hasMarketIds, marketFilters } = useMarketsData({
    filter: isSearchOpen ? filter : MarketFilters.ALL,
    searchFilter,
  });

  const setFilter = useCallback(
    (newFilter: MarketFilters) => {
      dispatch(setMarketFilter(newFilter));
    },
    [dispatch]
  );

  // Positions
  const openPositions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const openPositionsLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.loading) === 'pending';

  const setPositionSortType = useCallback(
    (newSortType: PositionSortType) => {
      dispatch(setSimpleUISortPositionsBy(newSortType));
    },
    [dispatch]
  );

  const onCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchFilter(undefined);
    setFilter(MarketFilters.ALL);
  }, [setFilter, setIsSearchOpen, setSearchFilter]);

  const sortedMarkets = sortMarkets(filteredMarkets, sortType);

  const sortedPositions = sortPositions(
    openPositions ?? EMPTY_ARR,
    filteredMarkets,
    subaccountEquity,
    positionSortType
  );

  const sortItems = useMemo(
    () => [
      {
        label: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
        value: MarketsSortType.MarketCap,
        active: sortType === MarketsSortType.MarketCap,
        icon: <Icon iconName={IconName.Price} />,
        onSelect: () => setSortType(MarketsSortType.MarketCap),
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
    [stringGetter, sortType, setSortType]
  );

  const positionSortItems = useMemo(
    () => [
      {
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        value: PositionSortType.Price,
        active: positionSortType === PositionSortType.Price,
        icon: <Icon iconName={IconName.Price} />,
        onSelect: () => setPositionSortType(PositionSortType.Price),
      },
      {
        label: stringGetter({ key: STRING_KEYS.PNL }),
        value: PositionSortType.Pnl,
        active: positionSortType === PositionSortType.Pnl,
        icon: <Icon iconName={IconName.TrendingUp} />,
        onSelect: () => setPositionSortType(PositionSortType.Pnl),
      },
      {
        label: stringGetter({ key: STRING_KEYS.POSITION }),
        value: PositionSortType.Notional,
        active: positionSortType === PositionSortType.Notional,
        icon: <Icon iconName={IconName.Position} />,
        onSelect: () => setPositionSortType(PositionSortType.Notional),
      },
      {
        label: stringGetter({ key: STRING_KEYS.MARGIN_USAGE }),
        value: PositionSortType.Leverage,
        active: positionSortType === PositionSortType.Leverage,
        icon: <Icon iconName={IconName.Margin} />,
        onSelect: () => setPositionSortType(PositionSortType.Leverage),
      },
    ],
    [stringGetter, positionSortType, setPositionSortType]
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
      ...(sortedPositions.length
        ? [
            {
              itemType: 'header' as const,
              item: stringGetter({ key: STRING_KEYS.YOUR_POSITIONS }),
              isSticky: true,
              slotRight: (
                <div tw="row mb-[-6px] gap-0.5">
                  <SimpleUiDropdownMenu
                    align="end"
                    tw="z-1"
                    items={positionSortItems}
                    slotTop={
                      <span tw="text-color-text-0 font-small-book">
                        {stringGetter({ key: STRING_KEYS.VIEW })}
                      </span>
                    }
                    side="bottom"
                  >
                    <Button
                      tw="pr-0"
                      size={ButtonSize.Small}
                      buttonStyle={ButtonStyle.WithoutBackground}
                    >
                      <span tw="text-color-text-0 font-small-book">
                        {positionSortItems.find((item) => item.value === positionSortType)?.label}
                      </span>
                      <Icon tw="size-1 min-w-1" iconName={IconName.Filter} />
                    </Button>
                  </SimpleUiDropdownMenu>
                </div>
              ),
            },
            ...sortedPositions.map((position) => ({
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
          <div tw="row mb-[-6px] gap-0.5">
            <span tw="text-color-text-0 font-small-book">
              {sortItems.find((item) => item.value === sortType)?.label}
            </span>
            <SimpleUiDropdownMenu
              align="end"
              tw="z-1"
              items={sortItems}
              slotTop={<span tw="text-color-text-0 font-small-book">Sort by</span>}
              side="bottom"
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
    [
      sortedPositions,
      sortedMarkets,
      stringGetter,
      slotTop,
      positionSortItems,
      positionSortType,
      sortItems,
      sortType,
    ]
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
        '--marketList-search-height': isSearchOpen ? '0' : '5.5rem',
        paddingBottom: 'var(--marketList-search-height)',
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
            <ItemRenderer listItem={items[virtualRow.index]!} />
          </div>
        ))}
      </div>

      <div
        tw="fixed bottom-0 left-0 right-0 z-[1] flex h-[var(--marketList-search-height)]"
        css={{
          display: isSearchOpen ? 'none' : 'flex',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
        }}
      >
        <button
          type="button"
          aria-label="Search"
          tw="p-[0 0.75rem] row mx-1.25 h-[3.25rem] w-auto flex-1 cursor-pointer rounded-[2.5rem] bg-color-layer-4 font-base-book"
          onClick={() => setIsSearchOpen(true)}
        >
          <span tw="row gap-0.5 text-color-text-2 opacity-50">
            <Icon tw="scale-x-[-1] scale-y-[1]" iconName={IconName.Search} />
            <span>{stringGetter({ key: STRING_KEYS.SEARCH })}...</span>
          </span>
        </button>
      </div>
    </div>
  );
};

const ItemRenderer = ({ listItem }: { listItem: ListItem }) => {
  const height = getItemHeight(listItem);

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
