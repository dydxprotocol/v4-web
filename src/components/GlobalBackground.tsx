import { ColorToken } from '@/constants/styles/base';

import { useCurrentAppThemeSetting } from '@/hooks/useAppThemeAndColorMode';

import { AppTheme } from '@/state/appUiConfigs';

// Fix: Use arrow function for function component, which resolves the lint error
const GlobalBackground: React.FC = () => {
  const currentTheme = useCurrentAppThemeSetting();
  const isDark = currentTheme === AppTheme.Dark;

  // Use BONKPurple2 for dark mode, Orange0 for light mode
  const gradientColor = isDark ? ColorToken.BONKPurple2 : ColorToken.Orange0;

  // Convert hex to rgba
  const hex = gradientColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const gradient = `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.5), rgba(${r}, ${g}, ${b}, 0))`;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 z-0 h-[42rem] max-h-[60vh] w-full"
      style={{
        top: '0',
        background: gradient,
      }}
    />
  );
};

export default GlobalBackground;
