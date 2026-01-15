import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Network as FuelNetwork } from 'fuels';
import { getEnv, getDefaultNetwork as getFallbackNetwork } from '@/lib/env';
import { useRequiredContext } from '@/lib/useRequiredContext';
import type { Network } from '@/models/Network';
import { WalletContext } from '../WalletContext/WalletContext';
import type { NetworkSwitchContextType } from './NetworkSwitchContext';
import { NetworkSwitchContext } from './NetworkSwitchContext';

type NetworkSwitchContextProviderProps = {
  children: (ctx: NetworkSwitchContextType) => ReactNode;
};

export const NetworkSwitchContextProvider: FC<NetworkSwitchContextProviderProps> = ({
  children,
}) => {
  const wallet = useRequiredContext(WalletContext);

  const [currentNetwork, setCurrentNetwork] = useState<Network>('testnet');

  const changeNetwork = useCallback(
    (network: Network) => {
      const networkRpcInfo = getNetworkRpcInfo(network);
      wallet.changeNetwork(networkRpcInfo);
    },
    [wallet]
  );

  const getCurrentNetwork = useCallback(
    () => currentNetwork ?? getFallbackNetwork(),
    [currentNetwork]
  );

  useEffect(
    function initializeNetwork() {
      if (!currentNetwork) {
        wallet.getCurrentNetwork().then((n) => setCurrentNetwork(getNetworkByRpcUrl(n.url)));
      }
    },
    [currentNetwork, wallet]
  );

  useEffect(
    function setupWalletNetworkChangeListener() {
      const listener = (network: FuelNetwork) => {
        setCurrentNetwork(getNetworkByRpcUrl(network.url));
      };
      wallet.registerNetworkChangeObserver(listener);
      return () => wallet.unregisterNetworkChangeObserver(listener);
    },
    [currentNetwork, wallet]
  );

  const contextValue = useMemo<NetworkSwitchContextType>(
    () => ({
      changeNetwork,
      getCurrentNetwork,
    }),
    [changeNetwork, getCurrentNetwork]
  );

  const childrenMemoized = useMemo(() => children(contextValue), [children, contextValue]);

  return (
    <NetworkSwitchContext.Provider value={contextValue}>
      {childrenMemoized}
    </NetworkSwitchContext.Provider>
  );
};

function getNetworkByRpcUrl(url: string) {
  const network = Object.entries(RPC_URLS)
    .flatMap(([network, networkUrl]) => {
      if (networkUrl !== url) return [];
      return network;
    })
    .at(0);

  if (!network) throw new Error(`Unknown network: ${url}.`);

  return network as Network;
}

function getNetworkRpcInfo(network: Network): FuelNetwork {
  return {
    chainId: +CHAIN_IDS[network],
    url: RPC_URLS[network],
  };
}

const CHAIN_IDS = JSON.parse(getEnv('VITE_CHAIN_IDS')) as Record<Network, string>;
const RPC_URLS = JSON.parse(getEnv('VITE_RPC_URLS')) as Record<Network, string>;
