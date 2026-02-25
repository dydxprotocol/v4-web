import { useCallback, useMemo, useRef, useState } from 'react';

import type { Range } from '@tanstack/react-virtual';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import orderBy from 'lodash/orderBy';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ListItem, MarketsSortType } from '@/constants/marketList';
import { MARKET_FILTER_OPTIONS, MarketData, MarketFilters } from '@/constants/markets';
import { MenuItem } from '@/constants/menus';

import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SearchInput } from '@/components/SearchInput';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';
import { SortIcon } from '@/components/SortIcon';
import { NewTag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSimpleUISortMarketsBy } from '@/state/appUiConfigs';
import { getSimpleUISortMarketsBy } from '@/state/appUiConfigsSelectors';
import { setMarketFilter } from '@/state/perpetuals';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import { isPresent } from '@/lib/typeUtils';

import { MarketRow } from './MarketRow';

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

export const MarketList = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  // Filters and sort
  const filter: MarketFilters = useAppSelector(getMarketFilter);
  const [searchFilter, setSearchFilter] = useState<string>();
  const sortType = useAppSelector(getSimpleUISortMarketsBy);

  const setSortType = useCallback(
    (newSortType: MarketsSortType) => {
      dispatch(setSimpleUISortMarketsBy(newSortType));
    },
    [dispatch]
  );

  // Markets and Filters
  const { filteredMarkets, hasMarketIds, marketFilters } = useMarketsData({
    filter,
    searchFilter,
  });

  const setFilter = useCallback(
    (newFilter: MarketFilters) => {
      dispatch(setMarketFilter(newFilter));
    },
    [dispatch]
  );

  const sortedMarkets = sortMarkets(filteredMarkets, sortType);

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

  const searchViewItems: ListItem[] = useMemo(
    () => [
      ...sortedMarkets.map((market) => ({
        itemType: 'market' as const,
        item: market,
      })),
    ],
    [sortedMarkets]
  );

  const items = searchViewItems;

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

  if (!hasMarketIds) {
    return <LoadingSpace id="markets-list" />;
  }

  const sortTypeLabel = sortItems.find((item) => item.value === sortType)?.label ?? '';

  return (
    <div
      ref={parentRef}
      tw="relative h-full max-h-full w-full max-w-full overflow-auto"
      css={{
        '--marketList-search-height': '5.5rem',
        paddingBottom: 'var(--marketList-search-height)',
      }}
    >
      <div tw="flexColumn gap-1 py-1 pt-[1.25rem]">
        <div tw="flexColumn gap-1">
          <div tw="row">
            <SearchInput
              tw="w-full"
              css={{
                '--search-input-icon-color': 'var(--color-text-2)',
                '--search-input-icon-opacity': 0.5,
              }}
              placeholder={`${stringGetter({ key: STRING_KEYS.SEARCH })}...`}
              onTextChange={setSearchFilter}
            />
            <div tw="row gap-0.5 pl-1">
              <span tw="text-color-text-0 font-small-book">{sortTypeLabel}</span>
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
          </div>
          <ToggleGroup
            items={
              Object.values(marketFilters).map((value) => {
                const { labelIconName, labelStringKey, isNew } = MARKET_FILTER_OPTIONS[value];
                return {
                  label: labelIconName ? (
                    <Icon iconName={labelIconName} />
                  ) : (
                    stringGetter({
                      key: labelStringKey,
                      fallback: value,
                    })
                  ),
                  slotAfter: isNew && <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>,
                  value,
                };
              }) satisfies MenuItem<MarketFilters>[]
            }
            css={{
              '--button-toggle-on-border': 'none',
              '--button-toggle-off-border': 'solid var(--default-border-width) var(--color-border)',
              '--button-toggle-off-backgroundColor': 'transparent',
              '--button-toggle-on-backgroundColor': 'var(--color-layer-4)',
            }}
            value={filter}
            onValueChange={setFilter}
            overflow="scroll"
          />
        </div>
      </div>
      <div
        tw="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            tw="left-0 top-0 w-full"
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
    </div>
  );
};

const ItemRenderer = ({ listItem }: { listItem: ListItem }) => {
  const height = getItemHeight(listItem);

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
      {(listItem as any)?.slotRight}
    </div>
  );
};
