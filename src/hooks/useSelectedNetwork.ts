import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, DydxNetwork, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { useAccounts, useLocalStorage } from '@/hooks';

import { setSelectedNetwork } from '@/state/app';
import { getSelectedNetwork } from '@/state/appSelectors';

export const useSelectedNetwork = (): {
  switchNetwork: (network: DydxNetwork) => void;
  selectedNetwork: DydxNetwork;
} => {
  const dispatch = useDispatch();
  const { disconnect } = useAccounts();
  const selectedNetwork = useSelector(getSelectedNetwork);

  const [, setLocalStorageNetwork] = useLocalStorage<DydxNetwork>({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
    validateFn: (value) => Object.keys(ENVIRONMENT_CONFIG_MAP).includes(value),
  });

  const switchNetwork = useCallback(
    (network: DydxNetwork) => {
      disconnect();

      setLocalStorageNetwork(network);
      dispatch(setSelectedNetwork(network));
    },
    [dispatch, disconnect, setLocalStorageNetwork]
  );

  return { switchNetwork, selectedNetwork };
};
