import { useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { SupportedLocales, SUPPORTED_LOCALE_STRING_LABELS } from '@/constants/localization';

import { headerMixins } from '@/styles/headerMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';

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
  const dispatch = useDispatch();
  const selectedLocale = useSelector(getSelectedLocale);

  return (
    <Styled.DropdownSelectMenu
      items={localizationItems}
      value={selectedLocale}
      onValueChange={(locale: SupportedLocales) => dispatch(setSelectedLocale({ locale }))}
      align={align}
      sideOffset={sideOffset}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DropdownSelectMenu = styled(DropdownSelectMenu)`
  ${headerMixins.dropdownTrigger}
`;
