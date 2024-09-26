import styled from 'styled-components';

import { SUPPORTED_LOCALE_STRING_LABELS, SupportedLocales } from '@/constants/localization';

import { headerMixins } from '@/styles/headerMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { Icon, IconName } from '@/components/Icon';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSelectedLocale } from '@/state/localization';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { testFlags } from '@/lib/testFlags';

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  sideOffset?: number;
};

const localizationItems = Object.values(SupportedLocales).map((locale) => ({
  value: locale,
  label: SUPPORTED_LOCALE_STRING_LABELS[locale],
}));

export const LanguageSelector = ({ align, sideOffset }: StyleProps) => {
  const dispatch = useAppDispatch();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const { uiRefresh } = testFlags;

  return (
    <$DropdownSelectMenu
      items={localizationItems}
      value={selectedLocale}
      onValueChange={(locale: SupportedLocales) => dispatch(setSelectedLocale({ locale }))}
      align={align}
      sideOffset={sideOffset}
    >
      {uiRefresh ? <Icon iconName={IconName.Translate} size="1.25em" /> : undefined}
    </$DropdownSelectMenu>
  );
};
const $DropdownSelectMenu = styled(DropdownSelectMenu)`
  ${headerMixins.dropdownTrigger}
  --trigger-padding: 0.33rem 0.5rem;
` as typeof DropdownSelectMenu;
