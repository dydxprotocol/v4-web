import styled, { type AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MARKET_FILTER_LABELS } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { SearchInput } from '@/components/SearchInput';
import { ToggleGroup } from '@/components/ToggleGroup';

export const MarketFilter = ({
  selectedFilter,
  filters,
  onChangeFilter,
  onSearchTextChange,
}: {
  selectedFilter: MarketFilters;
  filters: MarketFilters[];
  onChangeFilter: (filter: MarketFilters) => void;
  onSearchTextChange?: (filter: string) => void;
}) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { hasPotentialMarketsData } = usePotentialMarkets();
  const { isTablet } = useBreakpoints();

  return (
    <Styled.MarketFilter>
        <SearchInput
          placeholder={stringGetter({ key: STRING_KEYS.MARKET_SEARCH_PLACEHOLDER })}
          onTextChange={onSearchTextChange}
        />
        <Styled.ToggleGroupContainer>
          <ToggleGroup
            items={Object.values(filters).map((value) => ({
              label: stringGetter({ key: MARKET_FILTER_LABELS[value] }),
              value,
            }))}
            value={selectedFilter}
            onValueChange={onChangeFilter}
          />
          {hasPotentialMarketsData && !isTablet && (
            <Button
              onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
              size={ButtonSize.Small}
            >
              {stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })}
            </Button>
          )}
        </Styled.ToggleGroupContainer>
    </Styled.MarketFilter>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketFilter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  flex: 1;
`;

Styled.ToggleGroupContainer = styled.div`
  ${layoutMixins.row}
  justify-content: space-between;
  overflow-x: auto;
`;
