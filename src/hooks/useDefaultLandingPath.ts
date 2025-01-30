import { useMemo } from 'react';

import { WEB_CONFIG_MAP } from '@/constants/networks';
import { AppRoute, DEFAULT_TRADE_ROUTE } from '@/constants/routes';

export interface WebDeploymentConfig {
  defaultPath: string | null;
}

export const useDefaultLandingPath = (): string => {
  return useMemo(() => {
    const webConfig = WEB_CONFIG_MAP as WebDeploymentConfig;
    const { defaultPath } = webConfig;

    if (!defaultPath) return DEFAULT_TRADE_ROUTE;

    if (defaultPath.startsWith('/')) {
      defaultPath.split('/');

      if (defaultPath.length > 1) {
        if (Object.values(AppRoute).includes(defaultPath[0] as AppRoute)) {
          return defaultPath;
        }
      }
    }

    return DEFAULT_TRADE_ROUTE;
  }, []);
};
