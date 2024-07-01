import { useEffect } from 'react';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { initializeLocalization } from '@/state/app';
import { useAppDispatch } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { validateAgainstAvailableEnvironments } from '@/lib/network';

import { useLocalStorage } from './useLocalStorage';
import { useAllStatsigGateValues } from './useStatsig';

export const useInitializePage = () => {
  const dispatch = useAppDispatch();

  // Sync localStorage value with Redux
  const [localStorageNetwork] = useLocalStorage<DydxNetwork>({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
    validateFn: validateAgainstAvailableEnvironments,
  });
  const statsigConfig = useAllStatsigGateValues();

  useEffect(() => {
    dispatch(initializeLocalization());
    abacusStateManager.setStatsigConfigs(statsigConfig);
    abacusStateManager.start({ network: localStorageNetwork });
  }, [dispatch, localStorageNetwork, statsigConfig]);
};
