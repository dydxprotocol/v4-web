import { useEffect, useRef } from 'react';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { initializeLocalization } from '@/state/app';
import { useAppDispatch } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { validateAgainstAvailableEnvironments } from '@/lib/network';
import { getStatsigConfigAsync } from '@/lib/statsig';

import { useLocalStorage } from './useLocalStorage';

const RECONNECT_AFTER_HIDDEN_THRESHOLD = 10000;

export const useInitializePage = () => {
  const hiddenTimeRef = useRef<number | null>(null);
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
      const statsigConfig = await getStatsigConfigAsync();
      abacusStateManager.setStatsigConfigs(statsigConfig);
      abacusStateManager.start({ network: localStorageNetwork });
    };
    start();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // when user switches tabs, minimizes browser, or switches to different app
      if (document.visibilityState === 'hidden') {
        hiddenTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenTimeRef.current) {
          const hiddenDuration = Date.now() - hiddenTimeRef.current;
          if (hiddenDuration >= RECONNECT_AFTER_HIDDEN_THRESHOLD) {
            // reconnect abacus (reestablish connections to indexer, validator etc.) if app was hidden for more than 10 seconds
            abacusStateManager.restart({ network: localStorageNetwork });
          }
          hiddenTimeRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [localStorageNetwork]);
};
