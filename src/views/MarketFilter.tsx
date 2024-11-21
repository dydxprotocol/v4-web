import { ForwardedRef, forwardRef, useCallback, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MARKET_FILTER_OPTIONS, MarketFilters } from '@/constants/markets';
import { MenuItem } from '@/constants/menus';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { SearchInput } from '@/components/SearchInput';
import { Switch } from '@/components/Switch';
import { NewTag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithLabel } from '@/components/WithLabel';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setShouldHideLaunchableMarkets } from '@/state/appUiConfigs';
import { getShouldHideLaunchableMarkets } from '@/state/appUiConfigsSelectors';
import { setMarketFilter } from '@/state/perpetuals';

import { testFlags } from '@/lib/testFlags';

type MarketFilterProps = {
  selectedFilter: MarketFilters;
  filters: MarketFilters[];
  onChangeFilter: (filter: MarketFilters) => void;
  onSearchTextChange?: (filter: string) => void;
  hideNewMarketButton?: boolean;
  searchPlaceholderKey?: string;
  compactLayout?: boolean;
};

export const MarketFilter = forwardRef(
  (
    {
      selectedFilter,
      filters,
      onChangeFilter,
      onSearchTextChange,
      hideNewMarketButton,
      compactLayout = false,
      searchPlaceholderKey = STRING_KEYS.MARKET_SEARCH_PLACEHOLDER,
    }: MarketFilterProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const stringGetter = useStringGetter();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { hasPotentialMarketsData } = usePotentialMarkets();
    const { pml: showLaunchMarkets } = testFlags;
    const showProposeButton = hasPotentialMarketsData && !hideNewMarketButton;
    const shouldHideLaunchableMarkets = useAppSelector(getShouldHideLaunchableMarkets);

    const onShouldHideLaunchableMarkets = useCallback(
      (shouldHide: boolean) => {
        dispatch(setShouldHideLaunchableMarkets(!shouldHide));

        if (!shouldHide && selectedFilter === MarketFilters.LAUNCHABLE) {
          dispatch(setMarketFilter(MarketFilters.ALL));
        }
      },
      [dispatch, selectedFilter]
    );

    const unlaunchedMarketSwitch = useMemo(
      () =>
        testFlags.pml && (
          <WithLabel
            label={stringGetter({ key: STRING_KEYS.SHOW_LAUNCHABLE_MARKETS })}
            tw="flex flex-row items-center"
          >
            <Switch
              name="show-launchable"
              checked={!shouldHideLaunchableMarkets}
              onCheckedChange={onShouldHideLaunchableMarkets}
              tw="font-mini-book"
            />
          </WithLabel>
        ),
      [stringGetter, onShouldHideLaunchableMarkets, shouldHideLaunchableMarkets]
    );

    const filterToggles = (
      <$ToggleGroup
        items={
          Object.values(filters).map((value) => {
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
        value={selectedFilter}
        onValueChange={onChangeFilter}
        overflow="wrap"
        slotBefore={unlaunchedMarketSwitch}
      />
    );

    const launchMarketButton = (
      <Button
        onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
        size={ButtonSize.Small}
        shape={ButtonShape.Pill}
        action={ButtonAction.Primary}
      >
        {stringGetter({ key: STRING_KEYS.LAUNCH_MARKET_WITH_PLUS })}
      </Button>
    );

    return (
      <$MarketFilter ref={ref} $compactLayout={compactLayout}>
        <div tw="flex items-center gap-0.5">
          <$SearchInput
            placeholder={stringGetter({ key: searchPlaceholderKey })}
            onTextChange={onSearchTextChange}
          />
          {showProposeButton && showLaunchMarkets && launchMarketButton}
        </div>

        {filterToggles}
      </$MarketFilter>
    );
  }
);

const $MarketFilter = styled.div<{ $compactLayout: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;

  button {
    --button-toggle-off-border: none;
    --button-toggle-off-backgroundColor: transparent;
  }

  ${({ $compactLayout }) =>
    $compactLayout &&
    css`
      @media ${breakpoints.mobile} {
        flex-direction: column;
      }
    `}
`;

const $ToggleGroup = styled(ToggleGroup)`
  padding-right: var(--toggle-group-paddingRight);
` as typeof ToggleGroup;

const $SearchInput = styled(SearchInput)`
  min-width: 12rem;
  flex-grow: 1;
`;
