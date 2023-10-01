import { type MenuItem } from '@/constants/menus';
import {
  AVAILABLE_ENVIRONMENTS,
  type DydxNetwork,
  ENVIRONMENT_CONFIG_MAP,
} from '@/constants/networks';

export const useNetworks = (): MenuItem<DydxNetwork>[] =>
  (AVAILABLE_ENVIRONMENTS.environments as DydxNetwork[]).map((dydxNetwork) => ({
    key: dydxNetwork,
    label: ENVIRONMENT_CONFIG_MAP[dydxNetwork].name,
    value: dydxNetwork,
  }));
