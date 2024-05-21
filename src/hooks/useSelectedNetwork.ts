import { useCallback } from 'react';

import { useWallets } from '@privy-io/react-auth';
import { useDispatch, useSelector } from 'react-redux';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, DydxNetwork, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { setSelectedNetwork } from '@/state/app';
import { getSelectedNetwork } from '@/state/appSelectors';

import { validateAgainstAvailableEnvironments } from '@/lib/network';

import { useAccounts } from './useAccounts';
import { useLocalStorage } from './useLocalStorage';

export const useSelectedNetwork = (): {
  switchNetwork: (network: DydxNetwork) => void;
  selectedNetwork: DydxNetwork;
} => {
  const dispatch = useDispatch();
  const { disconnect } = useAccounts();
  const selectedNetwork = useSelector(getSelectedNetwork);

  const { wallets } = useWallets();
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

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
      const chainId = Number(ENVIRONMENT_CONFIG_MAP[selectedNetwork].ethereumChainId);
      privyWallet?.switchChain(chainId);
    },
    [dispatch, disconnect, setLocalStorageNetwork]
  );

  return { switchNetwork, selectedNetwork };
};
