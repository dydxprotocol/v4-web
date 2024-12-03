import { SUPPORTED_LOCALES, SupportedLocales } from '@/constants/localization';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSelectedLocale } from '@/state/localization';
import { getSelectedLocale } from '@/state/localizationSelectors';

type ElementProps = {
  children?: React.ReactNode;
};

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  sideOffset?: number;
  className?: string;
};

const localizationItems = SUPPORTED_LOCALES.map(({ locale, label }) => ({
  value: locale,
  label,
}));

export const LanguageSelector = ({
  children,
  align,
  sideOffset,
  className,
}: ElementProps & StyleProps) => {
  const dispatch = useAppDispatch();
  const selectedLocale = useAppSelector(getSelectedLocale);

  return (
    <DropdownSelectMenu
      className={className}
      items={localizationItems}
      value={selectedLocale}
      onValueChange={(locale: SupportedLocales) => dispatch(setSelectedLocale({ locale }))}
      align={align}
      sideOffset={sideOffset}
    >
      {children}
    </DropdownSelectMenu>
  );
};
