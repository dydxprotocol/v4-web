import { useCallback } from 'react';

import { useWallets } from '@privy-io/react-auth';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, DydxNetwork } from '@/constants/networks';

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
      privyWallet?.switchChain(Number(chainId));
    },
    [dispatch, disconnect, setLocalStorageNetwork, chainId]
  );

  return { switchNetwork, selectedNetwork };
};
