import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultConnectors } from '@fuels/connectors';
import { Fuel } from 'fuels';
import { WalletContext, type WalletContextType } from './WalletContext';

type WalletContextProviderProps = {
  children: ReactNode;
};

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  const [_isUserConnected, setIsUserConnected] = useState<boolean>();

  const fuelSdk = useMemo(
    () =>
      new Fuel({
        connectors: defaultConnectors({
          devMode: true,
        }),
      }),
    []
  );

  useEffect(() => {
    if (_isUserConnected === undefined) {
      fuelSdk.isConnected().then(setIsUserConnected);
    }
  }, [fuelSdk, _isUserConnected]);

  useEffect(() => {
    const listener = (isConnected: boolean) => {
      setIsUserConnected(isConnected);
    };
    fuelSdk.on(fuelSdk.events.connection, listener);
    return () => {
      fuelSdk.off(fuelSdk.events.connection, listener);
    };
  }, [fuelSdk]);

  const isUserConnected = useCallback(() => _isUserConnected ?? false, [_isUserConnected]);

  const establishConnection = useCallback(async () => {
    await fuelSdk.connect();
  }, [fuelSdk]);

  const disconnect = useCallback(async () => {
    await fuelSdk.disconnect();
  }, [fuelSdk]);

  const getCurrentNetwork = useCallback(async () => {
    return await fuelSdk.currentNetwork();
  }, [fuelSdk]);

  const changeNetwork = useCallback(
    async (network: Parameters<WalletContextType['changeNetwork']>[0]) => {
      await fuelSdk.selectNetwork(network);
    },
    [fuelSdk]
  );

  const getCurrentAccount = useCallback(async () => {
    const address = await fuelSdk.currentAccount();
    if (!address) return null;
    const account = await fuelSdk?.getWallet(address);

    if (!account) return null;
    return account;
  }, [fuelSdk]);

  const registerNetworkChangeObserver = useCallback(
    (listener: Parameters<WalletContextType['registerNetworkChangeObserver']>[0]) => {
      fuelSdk.on(fuelSdk.events.currentNetwork, listener);
    },
    [fuelSdk]
  );

  const unregisterNetworkChangeObserver = useCallback(
    (listener: Parameters<WalletContextType['unregisterNetworkChangeObserver']>[0]) => {
      fuelSdk.off(fuelSdk.events.currentNetwork, listener);
    },
    [fuelSdk]
  );

  const contextValue = useMemo<WalletContextType>(
    () => ({
      changeNetwork,
      disconnect,
      establishConnection,
      getCurrentAccount,
      getCurrentNetwork,
      isUserConnected,
      registerNetworkChangeObserver,
      unregisterNetworkChangeObserver,
    }),
    [
      changeNetwork,
      disconnect,
      establishConnection,
      getCurrentAccount,
      getCurrentNetwork,
      isUserConnected,
      registerNetworkChangeObserver,
      unregisterNetworkChangeObserver,
    ]
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};
