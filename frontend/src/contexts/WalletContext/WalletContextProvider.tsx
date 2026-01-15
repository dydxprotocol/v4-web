import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultConnectors } from '@fuels/connectors';
import { assetId, safeAddress } from 'fuel-ts-sdk';
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

  const connectedSdk = useMemo(() => {
    if (_isUserConnected) return fuelSdk;
    return undefined;
  }, [_isUserConnected, fuelSdk]);

  const getUserWalletReference = useCallback(async () => {
    const acc = await connectedSdk?.currentAccount();
    if (!acc) return;
    return await fuelSdk.getWallet(acc);
  }, [connectedSdk, fuelSdk]);

  const establishConnection = useCallback(async () => {
    await fuelSdk.connect();
  }, [fuelSdk]);

  const disconnect = useCallback(async () => {
    await fuelSdk.disconnect();
  }, [fuelSdk]);

  const getUserAddress = useCallback(async () => {
    const currentAccount = await connectedSdk?.currentAccount();

    return safeAddress(currentAccount?.toLowerCase());
  }, [connectedSdk]);

  const getUserBalances = useCallback(async () => {
    const wallet = await getUserWalletReference();
    if (!wallet) return {};

    const { balances } = await wallet.getBalances();
    return balances.reduce(
      (acc, b) => ({
        ...acc,
        [assetId(b.assetId)]: BigInt(b.amount.toString()),
      }),
      {}
    );
  }, [getUserWalletReference]);

  const getCurrentNetwork = useCallback(async () => {
    return await fuelSdk.currentNetwork();
  }, [fuelSdk]);

  const changeNetwork = useCallback(
    async (network: Parameters<WalletContextType['changeNetwork']>[0]) => {
      await fuelSdk.selectNetwork(network);
    },
    [fuelSdk]
  );

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
      getUserWalletReference,
      isUserConnected,
      disconnect,
      establishConnection,
      getUserAddress,
      getUserBalances,
      getCurrentNetwork,
      changeNetwork,
      registerNetworkChangeObserver,
      unregisterNetworkChangeObserver,
    }),
    [
      getUserWalletReference,
      isUserConnected,
      disconnect,
      establishConnection,
      getUserAddress,
      getUserBalances,
      getCurrentNetwork,
      changeNetwork,
      registerNetworkChangeObserver,
      unregisterNetworkChangeObserver,
    ]
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};
