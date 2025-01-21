import { useCallback } from 'react';

import { useActiveTheme } from '@funkit/connect';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme, AppThemeSetting } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';

/**
 * Sets the funkit sdk theme to the app's theme upon trigger
 */
export function useFlushFunkitTheme() {
  const appThemeSetting: AppThemeSetting = useAppSelector(getAppTheme);
  const { lightTheme, darkTheme, setTheme } = useActiveTheme();
  return useCallback(() => {
    setTheme(appThemeSetting === AppTheme.Light ? (lightTheme as any) : (darkTheme as any));
  }, [appThemeSetting, darkTheme, lightTheme, setTheme]);
}
