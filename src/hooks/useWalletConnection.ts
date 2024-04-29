import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth';
import {
  WalletType as CosmosWalletType,
  useAccount as useAccountGraz,
  useSuggestChainAndConnect as useConnectGraz,
  useDisconnect as useDisconnectGraz,
  useOfflineSigners as useOfflineSignersGraz,
} from 'graz';
import { useSelector } from 'react-redux';
import {
  useAccount as useAccountWagmi,
  useConnect as useConnectWagmi,
  useDisconnect as useDisconnectWagmi,
  usePublicClient as usePublicClientWagmi,
  useWalletClient as useWalletClientWagmi,
} from 'wagmi';

import { EvmDerivedAddresses } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import { WALLETS_CONFIG_MAP } from '@/constants/networks';
import {
  DYDX_CHAIN_INFO,
  WalletConnectionType,
  WalletType,
  wallets,
  type DydxAddress,
  type EvmAddress,
} from '@/constants/wallets';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { getSelectedDydxChainId } from '@/state/appSelectors';

import { log } from '@/lib/telemetry';
import { testFlags } from '@/lib/testFlags';
import { resolveWagmiConnector } from '@/lib/wagmi';
import { getWalletConnection, parseWalletError } from '@/lib/wallet';

import { useStringGetter } from './useStringGetter';

export const useWalletConnection = () => {
  const stringGetter = useStringGetter();

  // EVM wallet connection
  const [evmAddress, saveEvmAddress] = useLocalStorage<EvmAddress | undefined>({
    key: LocalStorageKey.EvmAddress,
    defaultValue: undefined,
  });
  const { address: evmAddressWagmi, isConnected: isConnectedWagmi } = useAccountWagmi();
  const publicClientWagmi = usePublicClientWagmi();
  const { data: signerWagmi } = useWalletClientWagmi();
  const { disconnectAsync: disconnectWagmi } = useDisconnectWagmi();

  useEffect(() => {
    // Cache last connected address
    if (evmAddressWagmi) saveEvmAddress(evmAddressWagmi);
  }, [evmAddressWagmi]);

  // Cosmos wallet connection
  const [dydxAddress, saveDydxAddress] = useLocalStorage<DydxAddress | undefined>({
    key: LocalStorageKey.DydxAddress,
    defaultValue: undefined,
  });
  const { data: dydxAccountGraz, isConnected: isConnectedGraz } = useAccountGraz();
  const { signer: signerGraz } = useOfflineSignersGraz();
  const { disconnectAsync: disconnectGraz } = useDisconnectGraz();

  const dydxAddressGraz = dydxAccountGraz?.bech32Address;

  useEffect(() => {
    // Cache last connected address
    if (dydxAddressGraz) saveDydxAddress(dydxAddressGraz as DydxAddress);
  }, [dydxAddressGraz]);

  // Wallet connection

  const [walletType, setWalletType] = useLocalStorage<WalletType | undefined>({
    key: LocalStorageKey.OnboardingSelectedWalletType,
    defaultValue: undefined,
  });

  const [walletConnectionType, setWalletConnectionType] = useLocalStorage<
    WalletConnectionType | undefined
  >({
    key: LocalStorageKey.WalletConnectionType,
    defaultValue: undefined,
  });

  // Wallet connection

  const selectedDydxChainId = useSelector(getSelectedDydxChainId);
  const walletConnectConfig = WALLETS_CONFIG_MAP[selectedDydxChainId].walletconnect;
  const wagmiConnector = useMemo(
    () =>
      walletType && walletConnectionType
        ? resolveWagmiConnector({
            walletType,
            walletConnection: {
              type: walletConnectionType,
            },
            walletConnectConfig,
          })
        : undefined,
    [walletConnectConfig, walletType, walletConnectionType]
  );

  const { connectAsync: connectWagmi } = useConnectWagmi({ connector: wagmiConnector });
  const { suggestAndConnect: connectGraz } = useConnectGraz();
  const [evmDerivedAddresses] = useLocalStorage({
    key: LocalStorageKey.EvmDerivedAddresses,
    defaultValue: {} as EvmDerivedAddresses,
  });
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin({
    onError: (error) => {
      if (error !== 'exited_auth_flow') {
        log('useWalletConnection/privy/useLogin', new Error(`Privy: ${error}`));
        setSelectedWalletError('Privy login failed');
      }
    },
  });
  const { logout } = useLogout();

  const connectWallet = useCallback(
    async ({
      walletType,
      forceConnect,
      isAccountConnected,
    }: {
      walletType?: WalletType;
      forceConnect?: boolean;
      isAccountConnected?: boolean;
    }) => {
      if (!walletType) return { walletType, walletConnectionType };

      const walletConnection = getWalletConnection({ walletType });

      try {
        if (!walletConnection) {
          throw new Error('Onboarding: No wallet connection found.');
        } else if (walletConnection.type === WalletConnectionType.Privy) {
          if (!isConnectedWagmi && ready && !authenticated) {
            login();
          }
        } else if (walletConnection.type === WalletConnectionType.CosmosSigner) {
          const cosmosWalletType = {
            [WalletType.Keplr as string]: CosmosWalletType.KEPLR,
          }[walletType];

          if (!cosmosWalletType) {
            throw new Error(
              `${stringGetter({ key: wallets[walletType].stringKey })} was not found.`
            );
          }

          if (!isConnectedGraz) {
            await connectGraz({
              chainInfo: DYDX_CHAIN_INFO,
              walletType: cosmosWalletType,
            });
          }
        } else if (walletConnection.type === WalletConnectionType.TestWallet) {
          saveEvmAddress(STRING_KEYS.TEST_WALLET as EvmAddress);
        } else {
          // if account connected (via remember me), do not show wagmi popup until forceConnect
          if (!isConnectedWagmi && (forceConnect || !isAccountConnected)) {
            await connectWagmi({
              connector: resolveWagmiConnector({
                walletType,
                walletConnection,
                walletConnectConfig,
              }),
            });
          }
        }
      } catch (error) {
        const { isErrorExpected } = parseWalletError({ error, stringGetter });
        if (!isErrorExpected) {
          throw Object.assign(
            new Error([error.message, error.cause?.message].filter(Boolean).join('\n')),
            {
              walletConnectionType: walletConnection?.type,
            }
          );
        }
      }

      return {
        walletType,
        walletConnectionType: walletConnection?.type,
      };
    },
    [isConnectedGraz, signerGraz, isConnectedWagmi, signerWagmi, ready, authenticated, login]
  );

  const disconnectWallet = useCallback(async () => {
    saveEvmAddress(undefined);
    saveDydxAddress(undefined);

    if (isConnectedWagmi) await disconnectWagmi();
    if (isConnectedGraz) await disconnectGraz();
    if (authenticated) await logout();
  }, [isConnectedGraz, isConnectedWagmi, authenticated, logout]);

  // Wallet selection

  const [selectedWalletType, setSelectedWalletType] = useState<WalletType | undefined>(walletType);
  const [selectedWalletError, setSelectedWalletError] = useState<string>();

  async function disconnectSelectedWallet() {
    setSelectedWalletType(undefined);
    setWalletType(undefined);
    setWalletConnectionType(undefined);

    await disconnectWallet();
  }

  useEffect(() => {
    (async () => {
      setSelectedWalletError(undefined);

      if (selectedWalletType) {
        try {
          const { walletType, walletConnectionType } = await connectWallet({
            walletType: selectedWalletType,
            isAccountConnected: Boolean(
              evmAddress && evmDerivedAddresses[evmAddress]?.encryptedSignature
            ),
          });

          setWalletType(walletType);
          setWalletConnectionType(walletConnectionType);
        } catch (error) {
          const { walletErrorType, message } = parseWalletError({
            error,
            stringGetter,
          });

          if (message) {
            log('useWalletConnection/connectWallet', error, { walletErrorType });
            setSelectedWalletError(message);
          }
        }
      } else {
        await disconnectSelectedWallet();
      }
    })();
  }, [selectedWalletType, signerWagmi, signerGraz, evmDerivedAddresses, evmAddress]);

  const selectWalletType = async (walletType: WalletType | undefined) => {
    if (selectedWalletType) {
      setSelectedWalletType(undefined);
      await new Promise(requestAnimationFrame);
    }

    setSelectedWalletType(walletType);
  };

  // On page load, if testFlag.address is set, connect to the test wallet.
  useEffect(() => {
    (async () => {
      if (testFlags.addressOverride) {
        setSelectedWalletType(WalletType.TestWallet);
      }
    })();
  }, []);

  return {
    // Wallet connection
    walletType,
    walletConnectionType,

    // Wallet selection
    selectWalletType,
    selectedWalletType,
    selectedWalletError,

    // Wallet connection (EVM)
    evmAddress,
    evmAddressWagmi,
    signerWagmi,
    publicClientWagmi,
    isConnectedWagmi,
    connectWallet: () =>
      connectWallet({
        walletType: selectedWalletType,
        forceConnect: true,
      }),

    // Wallet connection (Cosmos)
    dydxAddress,
    dydxAddressGraz,
    signerGraz,
  };
};
