import { type MenuItem } from '@/constants/menus';
import { type DydxNetwork, NETWORK_ENDPOINTS } from '@/constants/networks';
import { useStringGetter } from '@/hooks';

export const useNetworks = (): MenuItem<DydxNetwork>[] => {
  const stringGetter = useStringGetter();

  return NETWORK_ENDPOINTS.environments.map(({ stringKey, environment }) => ({
    key: environment,
    label: stringGetter({ key: stringKey }),
    value: environment,
  }));
};
