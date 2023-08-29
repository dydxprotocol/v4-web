import { ENDPOINTS, DEV_ENDPOINTS } from '@dydxprotocol/v4-localization';

import { type MenuItem } from '@/constants/menus';
import { DydxNetwork } from '@/constants/networks';
import { useStringGetter } from '@/hooks';

export const useNetworks = (): MenuItem<DydxNetwork>[] => {
  const stringGetter = useStringGetter();

  const environments =
    import.meta.env.MODE === 'production' ? ENDPOINTS.environments : DEV_ENDPOINTS.environments;

  return environments.map(({ stringKey, environment }) => ({
    key: environment,
    label: stringGetter({ key: stringKey }),
    value: environment,
  }));
};
