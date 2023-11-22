import { useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MARKET_FILTER_LABELS } from '@/constants/markets';

import { useStringGetter } from '@/hooks';

import { InputType } from '@/components/Input';
import { SearchInput } from '@/components/SearchInput';
import { ToggleGroup } from '@/components/ToggleGroup';

export const MarketFilter = ({
  selectedFilter,
  filters,
  onChangeFilter,
  onSearchTextChange,
  withoutSearch,
}: {
  selectedFilter: MarketFilters;
  filters: MarketFilters[];
  onChangeFilter: (filter: MarketFilters) => void;
  onSearchTextChange?: (filter: string) => void;
  withoutSearch?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const [isSearch, setIsSearch] = useState(false);

  return (
    <>
      {!isSearch && (
        <ToggleGroup
          items={Object.values(filters).map((value) => ({
            label: stringGetter({ key: MARKET_FILTER_LABELS[value] }),
            value,
          }))}
          value={selectedFilter}
          onValueChange={onChangeFilter}
        />
      )}

      {!withoutSearch && (
        <SearchInput
          type={InputType.Search}
          placeholder={stringGetter({ key: STRING_KEYS.MARKET_SEARCH_PLACEHOLDER })}
          onOpenChange={setIsSearch}
          onTextChange={onSearchTextChange}
        />
      )}
    </>
  );
};
