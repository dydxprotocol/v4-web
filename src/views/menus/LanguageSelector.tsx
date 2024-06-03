import styled from 'styled-components';

import { SUPPORTED_LOCALE_STRING_LABELS, SupportedLocales } from '@/constants/localization';

import { headerMixins } from '@/styles/headerMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSelectedLocale } from '@/state/localization';
import { getSelectedLocale } from '@/state/localizationSelectors';

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

  return (
    <$DropdownSelectMenu
      items={localizationItems}
      value={selectedLocale}
      onValueChange={(locale: SupportedLocales) => dispatch(setSelectedLocale({ locale }))}
      align={align}
      sideOffset={sideOffset}
    />
  );
};
const $DropdownSelectMenu = styled(DropdownSelectMenu)`
  ${headerMixins.dropdownTrigger}
` as typeof DropdownSelectMenu;
