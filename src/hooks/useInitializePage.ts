import { useEffect, useRef } from 'react';

import { AppStartupTimer } from '@/bonsai/appStartupTimer';
// eslint-disable-next-line no-restricted-imports
import { logBonsaiInfo } from '@/bonsai/logs';
// eslint-disable-next-line no-restricted-imports
import { CompositeClientManager } from '@/bonsai/rest/lib/compositeClientManager';
// eslint-disable-next-line no-restricted-imports
import { IndexerWebsocketManager } from '@/bonsai/websocket/lib/indexerWebsocketManager';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { initializeLocalization } from '@/state/app';
import { useAppDispatch } from '@/state/appTypes';

import { validateAgainstAvailableEnvironments } from '@/lib/network';

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
    AppStartupTimer.timeIfFirst('renderApp');
    dispatch(initializeLocalization());
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
            // reconnect (reestablish connections to indexer, validator etc.) if app was hidden for more than 10 seconds
            IndexerWebsocketManager.getActiveResources().forEach((r) => r.restart());
            CompositeClientManager.getActiveResources().forEach((r) => r.refreshConnections());
            logBonsaiInfo('useInitializePage', 'restarting because visibility change');
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

  // restart on network online
  useEffect(() => {
    const handleOnline = () => {
      IndexerWebsocketManager.getActiveResources().forEach((r) => r.restart());
      CompositeClientManager.getActiveResources().forEach((r) => r.refreshConnections());
      logBonsaiInfo('useInitializePage', 'restarting because network status change');
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [localStorageNetwork]);
};
