import { useSelector } from 'react-redux';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';

export interface EnvironmentFeatures {
  reduceOnlySupported: boolean;
  withdrawalSafetyEnabled: boolean;
  CCTPWithdrawalOnly: boolean;
  isSlTpEnabled: boolean;
  isSlTpLimitOrdersEnabled: boolean;
}

export const useEnvFeatures = (): EnvironmentFeatures => {
  const selectedNetwork = useSelector(getSelectedNetwork);
  return ENVIRONMENT_CONFIG_MAP[selectedNetwork].featureFlags;
};
