import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MARKET_FILTER_OPTIONS, MarketFilters } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { SearchInput } from '@/components/SearchInput';
import { NewTag } from '@/components/Tag';
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
    <$MarketFilter $compactLayout={compactLayout}>
      <SearchInput
        placeholder={stringGetter({ key: searchPlaceholderKey })}
        onTextChange={onSearchTextChange}
      />

      <div tw="row">
        <$ToggleGroupContainer $compactLayout={compactLayout}>
          <$ToggleGroup
            items={Object.values(filters).map((value) => ({
              label: stringGetter({ key: MARKET_FILTER_OPTIONS[value].label, fallback: value }),
              slotAfter: MARKET_FILTER_OPTIONS[value]?.isNew && (
                <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
              ),
              value,
            }))}
            value={selectedFilter}
            onValueChange={onChangeFilter}
          />
        </$ToggleGroupContainer>

        {hasPotentialMarketsData && !hideNewMarketButton && (
          <Button
            onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
            size={ButtonSize.Small}
          >
            {stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })}
          </Button>
        )}
      </div>
    </$MarketFilter>
  );
};
const $MarketFilter = styled.div<{ $compactLayout: boolean }>`
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

const $ToggleGroupContainer = styled.div<{ $compactLayout: boolean }>`
  ${layoutMixins.row}
  justify-content: space-between;
  overflow-x: hidden;
  position: relative;
  --toggle-group-paddingRight: 0.75rem;

  &:after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--toggle-group-paddingRight);
    background: linear-gradient(to right, transparent 10%, var(--color-layer-2));
  }

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

const $ToggleGroup = styled(ToggleGroup)`
  overflow-x: auto;
  padding-right: var(--toggle-group-paddingRight);
` as typeof ToggleGroup;
