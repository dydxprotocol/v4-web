import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketsSortType } from '@/constants/marketList';
import { MARKET_FILTER_OPTIONS, MarketFilters } from '@/constants/markets';
import { MenuItem } from '@/constants/menus';
import { ColorToken } from '@/constants/styles/base';

import { useCurrentAppThemeSetting } from '@/hooks/useAppThemeAndColorMode';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import type { DropdownMenuItem } from '@/components/DropdownMenu';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { SearchInput } from '@/components/SearchInput';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';
import { SortIcon } from '@/components/SortIcon';
import { NewTag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { AppTheme } from '@/state/appUiConfigs';

const MarketFilterRow = ({
  filter,
  marketFilters,
  onCloseSearch,
  setFilter,
  setSearchFilter,
  sortItems,
  sortTypeLabel,
}: {
  filter: MarketFilters;
  marketFilters: MarketFilters[];
  onCloseSearch: () => void;
  setFilter: (filter: MarketFilters) => void;
  setSearchFilter: (searchFilter: string) => void;
  sortItems: DropdownMenuItem<MarketsSortType>[];
  sortTypeLabel: string;
}) => {
  const stringGetter = useStringGetter();
  const currentTheme = useCurrentAppThemeSetting();
  const isDark = currentTheme === AppTheme.Dark;

  // Active: Purple0 for dark mode, Orange0 for light mode, with white text
  // Inactive: Transparent background in dark mode (white text, mild gray border), white in light mode (accent color text)
  const activeBgColor = isDark ? ColorToken.Purple0 : ColorToken.Orange0;
  const inactiveBgColor = isDark ? 'transparent' : ColorToken.White;
  const inactiveTextColor = isDark ? ColorToken.White : ColorToken.Orange0;
  const inactiveBorderColor = isDark ? ColorToken.MediumGray0 : undefined;

  return (
    <div tw="flexColumn gap-1 px-1.25 py-1 pt-[1.25rem]">
      <div tw="row justify-between">
        <div tw="row">
          <IconButton tw="mr-0.5" onClick={onCloseSearch} iconName={IconName.Close} />
          <span tw="text-color-text-2 font-medium-bold">
            {stringGetter({ key: STRING_KEYS.MARKETS })}
          </span>
        </div>
        <div tw="row gap-0.5">
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
      <div tw="flexColumn gap-1">
        <SearchInput
          tw="w-full"
          css={{
            '--search-input-icon-color': 'var(--color-text-2)',
            '--search-input-icon-opacity': 0.5,
          }}
          placeholder={`${stringGetter({ key: STRING_KEYS.SEARCH })}...`}
          onTextChange={setSearchFilter}
        />
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
            '--button-toggle-on-backgroundColor': activeBgColor,
            '--button-toggle-on-textColor': ColorToken.White,
            '--button-toggle-off-border': inactiveBorderColor
              ? `solid var(--default-border-width) ${inactiveBorderColor}`
              : 'solid var(--default-border-width) var(--color-border)',
            '--button-toggle-off-backgroundColor': inactiveBgColor,
            '--button-toggle-off-textColor': inactiveTextColor,
          }}
          value={filter}
          onValueChange={setFilter}
          overflow="scroll"
        />
      </div>
    </div>
  );
};

export default MarketFilterRow;
