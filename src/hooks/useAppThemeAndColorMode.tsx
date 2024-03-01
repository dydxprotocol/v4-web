import { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { Themes } from '@/styles/themes';

import { AppTheme, AppThemeSetting, AppColorMode, AppThemeSystemSetting } from '@/state/configs';
import { getAppThemeSetting, getAppColorMode } from '@/state/configsSelectors';

export const AppThemeAndColorModeProvider = ({ ...props }) => {
  return <ThemeProvider theme={useAppThemeAndColorModeContext()} {...props} />;
};

export const useAppThemeAndColorModeContext = () => {
  const themeSetting: AppThemeSetting = useSelector(getAppThemeSetting);
  const colorMode: AppColorMode = useSelector(getAppColorMode);

  const darkModePref = globalThis.matchMedia('(prefers-color-scheme: dark)');

  const [systemPreference, setSystemPreference] = useState(
    darkModePref.matches ? AppTheme.Dark : AppTheme.Light
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.matches) {
        setSystemPreference(AppTheme.Dark);
      } else {
        setSystemPreference(AppTheme.Light);
      }
    };
    darkModePref.addEventListener('change', handler);
    return () => darkModePref.removeEventListener('change', handler);
  }, []);

  const getThemeFromSetting = (): AppTheme => {
    switch (themeSetting) {
      case AppThemeSystemSetting.System:
        return systemPreference;
      case AppTheme.Classic:
      case AppTheme.Dark:
      case AppTheme.Light:
        return themeSetting;
    }
  };

  return Themes[getThemeFromSetting()][colorMode];
};
