import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

interface EnvironmentConfig {
  name: string;
  ethereumChainId: string;
  dydxChainId: string;
  chainName: string;
  chainLogo: string;
  deployerName: string;
  squidIntegratorId: string;
  rewardsHistoryStartDateMs: string;
}

export type EnvironmentConfigKey = keyof EnvironmentConfig;

export const useEnvConfig = (configKey: EnvironmentConfigKey): string => {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  return ENVIRONMENT_CONFIG_MAP[selectedNetwork][configKey];
};
