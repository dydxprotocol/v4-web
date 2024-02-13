import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, DydxChainId, DydxNetwork, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { useAccounts, useLocalStorage } from '@/hooks';

import { setSelectedNetwork } from '@/state/app';
import { getSelectedNetwork } from '@/state/appSelectors';

import { validateAgainstAvailableEnvironments } from '@/lib/network';

export const useSelectedNetwork = (): {
  switchNetwork: (network: DydxNetwork) => void;
  selectedNetwork: DydxNetwork;
  selectedDydxChainId: DydxChainId;
} => {
  const dispatch = useDispatch();
  const { disconnect } = useAccounts();
  const selectedNetwork = useSelector(getSelectedNetwork);

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
    [dispatch, disconnect, setLocalStorageNetwork]
  );

  return {
    switchNetwork,
    selectedNetwork,
    selectedDydxChainId: ENVIRONMENT_CONFIG_MAP[selectedNetwork as DydxNetwork].dydxChainId as DydxChainId,
  };
};
