import { useCurrentAppThemeSetting } from '@/hooks/useAppThemeAndColorMode';

import Logo from '@/icons/logos/logo.png';
import LogoDark from '@/icons/logos/logo_dark.png';

import { AppTheme } from '@/state/appUiConfigs';

export const LogoShortIcon: React.FC<{ id?: string; width?: number; height?: number }> = ({
  id,
  width = 179,
  height = 204,
}: {
  id?: string;
  width?: number;
  height?: number;
}) => {
  const currentTheme = useCurrentAppThemeSetting();
  const isDark = currentTheme === AppTheme.Dark;
  const logoSrc = isDark ? Logo : LogoDark;

  return (
    <div
      id={id}
      className="flex h-auto w-full flex-row items-start justify-center overflow-hidden object-center"
    >
      <img
        src={logoSrc}
        alt="Bonk"
        width={width}
        height={height}
        className="h-full object-contain"
      />
    </div>
  );
};
