import { useNavigate } from 'react-router-dom';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MARKET_FILTER_LABELS, MarketFilters } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { SearchInput } from '@/components/SearchInput';
import { ToggleGroup } from '@/components/ToggleGroup';

export const MarketFilter = ({
  selectedFilter,
  filters,
  onChangeFilter,
  onSearchTextChange,
  hideNewMarketButton,
  compactLayout = false,
  searchPlaceholderKey = STRING_KEYS.MARKET_SEARCH_PLACEHOLDER,
}: {
  selectedFilter: MarketFilters;
  filters: MarketFilters[];
  onChangeFilter: (filter: MarketFilters) => void;
  onSearchTextChange?: (filter: string) => void;
  hideNewMarketButton?: boolean;
  searchPlaceholderKey?: string;
  compactLayout?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  return (
    <Styled.MarketFilter $compactLayout={compactLayout}>
      <SearchInput
        placeholder={stringGetter({ key: searchPlaceholderKey })}
        onTextChange={onSearchTextChange}
      />
      <Styled.ToggleGroupContainer $compactLayout={compactLayout}>
        <ToggleGroup
          items={Object.values(filters).map((value) => ({
            label: stringGetter({ key: MARKET_FILTER_LABELS[value] }),
            value,
          }))}
          value={selectedFilter}
          onValueChange={onChangeFilter}
        />
        {hasPotentialMarketsData && !hideNewMarketButton && (
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

Styled.MarketFilter = styled.div<{ $compactLayout: boolean }>`
  display: flex;
  flex-direction: ${({ $compactLayout }) => ($compactLayout ? 'row-reverse' : 'column')};
  justify-content: space-between;
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;

  ${({ $compactLayout }) =>
    $compactLayout &&
    css`
      @media ${breakpoints.mobile} {
        flex-direction: column;
      }
    `}
`;

Styled.ToggleGroupContainer = styled.div<{ $compactLayout: boolean }>`
  ${layoutMixins.row}
  justify-content: space-between;
  overflow-x: auto;

  ${({ $compactLayout }) =>
    $compactLayout &&
    css`
      & button {
        --button-toggle-off-backgroundColor: ${({ theme }) => theme.toggleBackground};
        --button-toggle-off-textColor: ${({ theme }) => theme.textSecondary};
        --border-color: ${({ theme }) => theme.layer6};
        --button-height: 2rem;
        --button-padding: 0 0.625rem;
        --button-font: var(--font-small-book);
      }
    `}
`;
