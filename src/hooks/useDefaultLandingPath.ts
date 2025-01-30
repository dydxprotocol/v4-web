import { useMemo } from 'react';

import { WEB_CONFIG_MAP } from '@/constants/networks';
import { AppRoute, DEFAULT_TRADE_ROUTE } from '@/constants/routes';

import { log } from '@/lib/telemetry';

export interface WebDeploymentConfig {
  defaultPath: string | null;
}

export const useDefaultLandingPath = (): string => {
  return useMemo(() => {
    const webConfig = WEB_CONFIG_MAP as WebDeploymentConfig;
    const { defaultPath } = webConfig;

    if (!defaultPath) return DEFAULT_TRADE_ROUTE;

    try {
      if (!defaultPath.startsWith('/')) {
        throw new Error('Invalid default path');
      }

      const splitPath = defaultPath.split('/');
      if (splitPath.length < 1) {
        throw new Error('Invalid default path');
      }

      if (!Object.values(AppRoute).includes(defaultPath[0] as AppRoute)) {
        throw new Error('Invalid AppRoute');
      }

      return defaultPath;
    } catch (e) {
      log('useDefaultLandingPath', e, { defaultPath });
    }

    return DEFAULT_TRADE_ROUTE;
  }, []);
};
