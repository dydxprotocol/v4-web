import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';
import { LocalStorageKey } from '@/constants/localStorage';
import { CLIENT_NETWORK_CONFIGS, DEFAULT_APP_ENVIRONMENT, DydxNetwork } from '@/constants/networks';

import { useAccounts, useLocalStorage } from '@/hooks';

import { setSelectedNetwork } from '@/state/app';
import { getSelectedNetwork } from '@/state/appSelectors';
import { openDialog } from '@/state/dialogs';

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
  });

  useEffect(() => {
    if (
      import.meta.env.MODE === 'production' &&
      CLIENT_NETWORK_CONFIGS[selectedNetwork].dydxChainId === 'dydx-testnet-3'
    ) {
      dispatch(
        openDialog({ type: DialogTypes.ExchangeOffline, dialogProps: { preventClose: true } })
      );
    }
  }, [selectedNetwork]);

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
