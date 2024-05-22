import { useSelector } from 'react-redux';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';

interface EnvironmentConfig {
  name: string;
  ethereumChainId: string;
  dydxChainId: string;
  chainName: string;
  chainLogo: string;
  squidIntegratorId: string;
  rewardsHistoryStartDateMs: string;
}

export type EnvironmentConfigKey = keyof EnvironmentConfig;

export const useEnvConfig = (configKey: EnvironmentConfigKey): string => {
  const selectedNetwork = useSelector(getSelectedNetwork);
  return ENVIRONMENT_CONFIG_MAP[selectedNetwork][configKey];
};
