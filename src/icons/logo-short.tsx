import LogoDark from '@/icons/logos/logo-mark-dark.svg';
import LogoLight from '@/icons/logos/logo-mark-light.svg';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme, AppThemeSetting } from '@/state/appUiConfigs';
import { getAppThemeSetting } from '@/state/appUiConfigsSelectors';

export const LogoShortIcon: React.FC<{ id?: string; width?: number; height?: number }> = ({
  id,
  width,
  height,
}: {
  id?: string;
  width?: number;
  height?: number;
}) => {
  const themeSetting: AppThemeSetting = useAppSelector(getAppThemeSetting);
  const isDark = themeSetting === AppTheme.Dark;
  return (
    <div
      id={id}
      className="ml-1 flex h-auto w-full flex-row items-start justify-center overflow-hidden object-center"
      style={{ width, height }}
    >
      {!isDark ? <LogoDark /> : <LogoLight />}
    </div>
  );
};
