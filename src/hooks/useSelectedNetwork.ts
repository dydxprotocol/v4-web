import { useCallback, useEffect } from 'react';

import { LocalStorageKey } from '@/constants/localStorage';
import { AVAILABLE_ENVIRONMENTS, DEFAULT_APP_ENVIRONMENT, DydxNetwork } from '@/constants/networks';

import { setSelectedNetwork } from '@/state/app';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import { validateAgainstAvailableEnvironments } from '@/lib/network';

import { useAccounts } from './useAccounts';
import { useEnvConfig } from './useEnvConfig';
import { useLocalStorage } from './useLocalStorage';

export const useSelectedNetwork = (): {
  switchNetwork: (network: DydxNetwork) => void;
  selectedNetwork: DydxNetwork;
} => {
  const dispatch = useAppDispatch();
  const { disconnect } = useAccounts();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const chainId = useEnvConfig('ethereumChainId');

  const [, setLocalStorageNetwork] = useLocalStorage<DydxNetwork>({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
    validateFn: validateAgainstAvailableEnvironments,
  });

  const switchNetwork = useCallback(
    (network: DydxNetwork) => {
      disconnect();

      setLocalStorageNetwork(network);
      dispatch(setSelectedNetwork(network));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, disconnect, setLocalStorageNetwork, chainId]
  );

  // Ensure the selected network is valid
  useEffect(() => {
    if (!AVAILABLE_ENVIRONMENTS.environments.includes(selectedNetwork)) {
      switchNetwork(DEFAULT_APP_ENVIRONMENT);
    }
  }, [selectedNetwork, switchNetwork]);

  return { switchNetwork, selectedNetwork };
};
