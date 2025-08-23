import { FuelWalletConnector } from '@fuels/connectors';
import { Fuel } from 'fuels';
import { useCallback, useEffect, useState } from 'react';

import { OnboardingState } from '@/constants/account';
import { ConnectorType, WalletNetworkType, WalletType } from '@/constants/wallets';
import { setOnboardingState } from '@/state/account';
import { useAppDispatch } from '@/state/appTypes';
import { clearSourceAccount, setSourceAddress, setWalletInfo } from '@/state/wallet';

export interface FuelWalletInfo {
  connectorType: ConnectorType.Injected;
  name: WalletType.FuelWallet;
  icon: `data:image/${string}`;
  rdns: string;
}

export const useFuelWallet = () => {
  const dispatch = useAppDispatch();
  const [fuel, setFuel] = useState<Fuel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Initialize Fuel instance
  useEffect(() => {
    const fuelInstance = new Fuel({
      connectors: [
        new FuelWalletConnector(),
      ],
    });
    setFuel(fuelInstance);
  }, []);

  // Check connection status on mount and when fuel changes
  useEffect(() => {
    if (!fuel) return;

    const checkConnection = async () => {
      try {
        const connection = await fuel.currentConnector();

        if (connection) {
          const accounts = await fuel.accounts();

          if (accounts && accounts.length > 0) {
            const account = accounts[0] as any; // Type assertion to handle Fuel SDK type inference

            // Try different ways to get the address
            let accountAddress = '';
            if (typeof account === 'string') {
              accountAddress = account;
            } else if (account && typeof account === 'object' && 'address' in account) {
              accountAddress = String(account.address);
            } else {
              return;
            }

            setIsConnected(true);
            setAddress(accountAddress);

            dispatch(setSourceAddress({
              address: accountAddress,
              chain: WalletNetworkType.Evm
            }));

            dispatch(setWalletInfo({
              connectorType: ConnectorType.Injected,
              name: WalletType.FuelWallet,
              icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwRkY4OCIvPgo8cGF0aCBkPSJNOCAxMkM4IDEwLjg5NTQgOC44OTU0MyAxMCAxMCAxMEgyMkMyMy4xMDQ2IDEwIDI0IDEwLjg5NTQgMjQgMTJWMjBDMjQgMjEuMTA0NiAyMy4xMDQ2IDIyIDIyIDIySDEwQzguODk1NDMgMjIgOCAyMS4xMDQ2IDggMjBWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMTZDMjQgMTQuODk1NCAyMy4xMDQ2IDE0IDIyIDE0SDI2QzI3LjEwNDYgMTQgMjggMTQuODk1NCAyOCAxNlYxNkMyOCAxNy4xMDQ2IDI3LjEwNDYgMTggMjYgMThIMjJDMjMuMTA0NiAxOCAyNCAxNy4xMDQ2IDI0IDE2WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMiIgZmlsbD0iIzAwRkY4OCIvPgo8L3N2Zz4K',
              rdns: 'fuel-wallet',
            } as FuelWalletInfo));

            // For Fuel wallet, skip key derivation and go directly to AccountConnected
            dispatch(setOnboardingState(OnboardingState.AccountConnected));
          } else {
            setIsConnected(false);
            setAddress(undefined);
            // Reset onboarding state when no accounts
            dispatch(setOnboardingState(OnboardingState.Disconnected));
          }
        } else {
          setIsConnected(false);
          setAddress(undefined);
          // Reset onboarding state when no connector
          dispatch(setOnboardingState(OnboardingState.Disconnected));
        }
      } catch (err) {
        console.error('Error checking Fuel connection:', err);
        setIsConnected(false);
        setAddress(undefined);
        // Reset onboarding state on error
        dispatch(setOnboardingState(OnboardingState.Disconnected));
      }
    };

    checkConnection();
  }, [fuel, dispatch]);

  const connect = useCallback(async () => {
    if (!fuel) {
      setError('Fuel not initialized');
      return;
    }

    try {
      setIsConnecting(true);
      setError(undefined);

      // Select the Fuel Wallet connector
      await fuel.selectConnector('Fuel Wallet');

      // Connect to the wallet
      const connection = await fuel.connect();

      if (connection) {
        const accounts = await fuel.accounts();

        if (accounts && accounts.length > 0) {
          const account = accounts[0] as any; // Type assertion to handle Fuel SDK type inference

          // Try different ways to get the address
          let accountAddress = '';
          if (typeof account === 'string') {
            accountAddress = account;
          } else if (account && typeof account === 'object' && 'address' in account) {
            accountAddress = String(account.address);
          } else {
            setError('Could not get account address');
            return;
          }

          setIsConnected(true);
          setAddress(accountAddress);

          dispatch(setSourceAddress({
            address: accountAddress,
            chain: WalletNetworkType.Evm
          }));

          dispatch(setWalletInfo({
            connectorType: ConnectorType.Injected,
            name: WalletType.FuelWallet,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwRkY4OCIvPgo8cGF0aCBkPSJNOCAxMkM4IDEwLjg5NTQgOC44OTU0MyAxMCAxMCAxMEgyMkMyMy4xMDQ2IDEwIDI0IDEwLjg5NTQgMjQgMTJWMjBDMjQgMjEuMTA0NiAyMy4xMDQ2IDIyIDIyIDIySDEwQzguODk1NDMgMjIgOCAyMS4xMDQ2IDggMjBWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMTZDMjQgMTQuODk1NCAyMy4xMDQ2IDE0IDIyIDE0SDI2QzI3LjEwNDYgMTQgMjggMTQuODk1NCAyOCAxNlYxNkMyOCAxNy4xMDQ2IDI3LjEwNDYgMTggMjYgMThIMjJDMjMuMTA0NiAxOCAyNCAxNy4xMDQ2IDI0IDE2WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMiIgZmlsbD0iIzAwRkY4OCIvPgo8L3N2Zz4K',
            rdns: 'fuel-wallet',
          } as FuelWalletInfo));

          // For Fuel wallet, skip key derivation and go directly to AccountConnected
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Fuel wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [fuel, dispatch]);

  const disconnect = useCallback(async () => {
    if (!fuel) return;

    try {
      await fuel.disconnect();
      setIsConnected(false);
      setAddress(undefined);
      dispatch(clearSourceAccount());
      // Reset onboarding state when disconnecting
      dispatch(setOnboardingState(OnboardingState.Disconnected));
    } catch (err) {
      console.error('Error disconnecting from Fuel wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect from Fuel wallet');
    }
  }, [fuel, dispatch]);

  const getAccounts = useCallback(async () => {
    if (!fuel || !isConnected) return [];

    try {
      const accounts = await fuel.accounts();
      return accounts || [];
    } catch (err) {
      console.error('Error getting Fuel accounts:', err);
      return [];
    }
  }, [fuel, isConnected]);

  return {
    fuel,
    isConnected,
    address,
    isConnecting,
    error,
    connect,
    disconnect,
    getAccounts,
  };
};
