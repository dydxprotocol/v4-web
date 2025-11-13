/* eslint-disable @typescript-eslint/no-unused-vars */
import LogoDark from '@/icons/logos/logo-mark-dark.svg';
import LogoLight from '@/icons/logos/logo-mark-light.svg';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme, AppThemeSetting } from '@/state/appUiConfigs';
import { getAppThemeSetting } from '@/state/appUiConfigsSelectors';

export const LogoShortIcon: React.FC<{ id?: string; width?: number; height?: number }> = ({
  id,
  width = 135,
  height = 145,
}: {
  id?: string;
  width?: number;
  height?: number;
}) => {
  const themeSetting: AppThemeSetting = useAppSelector(getAppThemeSetting);
  const isDark = themeSetting === AppTheme.Dark;
  // return !isDark ? <LogoDark /> : <LogoLight />;
  return (
    <div id={id} className="overflow-hidden object-center">
      {!isDark ? <LogoDark /> : <LogoLight />}
    </div>
  );
};
