import { useEffect } from 'react';

import { useActiveTheme } from '@funkit/connect';

import { useAppSelector } from '../state/appTypes';
import { AppTheme, AppThemeSetting } from '../state/configs';
import { getAppTheme } from '../state/configsSelectors';

export function useFunkitThemeListener() {
  const appThemeSetting: AppThemeSetting = useAppSelector(getAppTheme);
  const { lightMode, darkMode, setTheme } = useActiveTheme();
  // Set the funkit theme based on the initialized app theme
  useEffect(() => {
    setTheme(appThemeSetting === AppTheme.Light ? (lightMode as any) : (darkMode as any));
  }, [appThemeSetting]);
}
