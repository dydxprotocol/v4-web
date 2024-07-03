import { useEffect } from 'react';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { initializeLocalization } from '@/state/app';
import { useAppDispatch } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { validateAgainstAvailableEnvironments } from '@/lib/network';
import { statsigConfigPromise } from '@/lib/statsig';

import { useLocalStorage } from './useLocalStorage';

export const useInitializePage = () => {
  const dispatch = useAppDispatch();

  // Sync localStorage value with Redux
  const [localStorageNetwork] = useLocalStorage<DydxNetwork>({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
    validateFn: validateAgainstAvailableEnvironments,
  });

  useEffect(() => {
    dispatch(initializeLocalization());
    const start = async () => {
      const statsigConfig = await statsigConfigPromise();
      abacusStateManager.setStatsigConfigs(statsigConfig);
      // Set store so (Abacus & v4-Client) classes can getState and dispatch
      abacusStateManager.start({ network: localStorageNetwork });
    };
    start();
  }, []);
};
