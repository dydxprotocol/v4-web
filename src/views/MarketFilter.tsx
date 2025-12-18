import { ForwardedRef, forwardRef, useCallback, useMemo } from 'react';

import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { MARKET_FILTER_OPTIONS, MarketFilters } from '@/constants/markets';
import { MenuItem } from '@/constants/menus';
import { ColorToken } from '@/constants/styles/base';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { Icon } from '@/components/Icon';
import { SearchInput } from '@/components/SearchInput';
import { Switch } from '@/components/Switch';
import { NewTag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithLabel } from '@/components/WithLabel';

import { useAppDispatch } from '@/state/appTypes';
import { setShouldHideLaunchableMarkets } from '@/state/appUiConfigs';

type MarketFilterProps = {
  selectedFilter: MarketFilters;
  filters: MarketFilters[];
  onChangeFilter: (filter: MarketFilters) => void;
  onSearchTextChange?: (filter: string) => void;
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
      compactLayout = false,
      searchPlaceholderKey = STRING_KEYS.MARKET_SEARCH_PLACEHOLDER,
    }: MarketFilterProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const stringGetter = useStringGetter();
    const dispatch = useAppDispatch();
    const shouldHideLaunchableMarkets = true;

    const onShouldHideLaunchableMarkets = useCallback(
      (shouldHide: boolean) => {
        dispatch(setShouldHideLaunchableMarkets(!shouldHide));

        // if (!shouldHide && selectedFilter === MarketFilters.LAUNCHABLE) {
        //   dispatch(setMarketFilter(MarketFilters.ALL));
        // }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [dispatch, selectedFilter]
    );

    const unlaunchedMarketSwitch = useMemo(
      () => (
        <WithLabel
          label={stringGetter({ key: STRING_KEYS.SHOW_LAUNCHABLE_MARKETS })}
          tw="mr-1 hidden flex-row flex-nowrap items-center"
        >
          <Switch
            name="show-launchable"
            checked={!shouldHideLaunchableMarkets}
            onCheckedChange={onShouldHideLaunchableMarkets}
            tw="inline-block font-mini-book"
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
              slotAfter: isNew && (
                <NewTag tw="ml-px px-0.25 py-0 font-tiny-book">
                  {stringGetter({ key: STRING_KEYS.NEW })}
                </NewTag>
              ),
              value,
            };
          }) satisfies MenuItem<MarketFilters>[]
        }
        value={selectedFilter}
        onValueChange={onChangeFilter}
        overflow="scroll"
        slotBefore={unlaunchedMarketSwitch}
      />
    );

    return (
      <$MarketFilter ref={ref} $compactLayout={compactLayout}>
        <div tw="flex items-center gap-0.5">
          <$SearchInput
            placeholder={stringGetter({ key: searchPlaceholderKey })}
            onTextChange={onSearchTextChange}
          />
        </div>
        <div tw="relative flex w-full items-center justify-start gap-0.5 overflow-hidden overflow-x-auto">
          {filterToggles}
        </div>
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
    --button-toggle-on-border: none;
    --button-toggle-on-backgroundColor: ${({ theme }) =>
      theme.layer0 === ColorToken.BONKPurple1 ? ColorToken.Purple0 : ColorToken.Orange0};
    --button-toggle-on-textColor: ${ColorToken.White};
    --button-toggle-off-border: ${({ theme }) =>
      theme.layer0 === ColorToken.BONKPurple1
        ? `1px solid ${ColorToken.MediumGray0}`
        : '1px solid var(--color-layer-6)'};
    --button-toggle-off-backgroundColor: ${({ theme }) =>
      theme.layer0 === ColorToken.BONKPurple1 ? 'transparent' : ColorToken.White};
    --button-toggle-off-textColor: ${({ theme }) =>
      theme.layer0 === ColorToken.BONKPurple1 ? ColorToken.White : ColorToken.Orange0};
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
