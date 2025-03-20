import { useState } from 'react';

import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

import { MarketFilters } from '@/constants/markets';

import { useMarketsData } from '@/hooks/useMarketsData';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SearchInput } from '@/components/SearchInput';

import { useAppSelector } from '@/state/appTypes';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import MarketRow from './MarketRow';

export const MarketsList = () => {
  const filter: MarketFilters = useAppSelector(getMarketFilter);
  const [searchFilter, setSearchFilter] = useState<string>();
  const { filteredMarkets, marketFilters, hasMarketIds } = useMarketsData({
    filter,
    searchFilter,
  });

  if (!hasMarketIds) {
    return <LoadingSpace id="markets-list" />;
  }

  return (
    <div tw="relative h-full w-full">
      <AutoSizer>
        {({ width, height }) => (
          <List itemCount={filteredMarkets.length} width={width} height={height} itemSize={60}>
            {({ index, style }) => (
              <MarketRow key={index} market={filteredMarkets[index]!} style={style} />
            )}
          </List>
        )}
      </AutoSizer>
      <div
        tw="absolute bottom-0 left-0 right-0 h-[4.5rem]"
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
