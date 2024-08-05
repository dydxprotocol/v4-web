import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

export interface EnvironmentFeatures {
  checkForGeo: boolean;
  reduceOnlySupported: boolean;
  withdrawalSafetyEnabled: boolean;
  CCTPWithdrawalOnly: boolean;
  CCTPDepositOnly: boolean;
  isSlTpEnabled: boolean;
  isSlTpLimitOrdersEnabled: boolean;
  isOhlcEnabled: boolean;
}

export const useEnvFeatures = (): EnvironmentFeatures => {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  return ENVIRONMENT_CONFIG_MAP[selectedNetwork].featureFlags;
};
