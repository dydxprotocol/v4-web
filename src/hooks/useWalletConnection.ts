import { useCallback, useEffect, useState } from 'react';

import { useLogin, useLogout, useMfa, useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import {
  WalletType as CosmosWalletType,
  useAccount as useAccountGraz,
  useConnect as useConnectGraz,
  useDisconnect as useDisconnectGraz,
} from 'graz';
import {
  useAccount as useAccountWagmi,
  useConnect as useConnectWagmi,
  useDisconnect as useDisconnectWagmi,
  usePublicClient as usePublicClientWagmi,
  useReconnect as useReconnectWagmi,
  useWalletClient as useWalletClientWagmi,
} from 'wagmi';

import { EvmDerivedAddresses } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import { WALLETS_CONFIG_MAP } from '@/constants/networks';
import {
  WalletConnectionType,
  WalletType,
  wallets,
  type DydxAddress,
  type EvmAddress,
} from '@/constants/wallets';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { SUPPORTED_COSMOS_CHAINS } from '@/lib/graz';
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
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  useEffect(() => {
    // Cache last connected address
    if (evmAddressWagmi) saveEvmAddress(evmAddressWagmi);
  }, [evmAddressWagmi]);

  // Cosmos wallet connection
  const [dydxAddress, saveDydxAddress] = useLocalStorage<DydxAddress | undefined>({
    key: LocalStorageKey.DydxAddress,
    defaultValue: undefined,
  });
  const { data: dydxAccountGraz, isConnected: isConnectedGraz } = useAccountGraz({
    chainId: selectedDydxChainId,
  });

  const { disconnectAsync: disconnectGraz } = useDisconnectGraz();

  const dydxAddressGraz = dydxAccountGraz?.bech32Address;

  const getCosmosOfflineSigner = async (chainId: string) => {
    if (isConnectedGraz) {
      const keplr = window.keplr;

      const offlineSigner = await keplr?.getOfflineSigner(chainId);

      return offlineSigner;
    }

    return undefined;
  };

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

  const walletConnectConfig = WALLETS_CONFIG_MAP[selectedDydxChainId].walletconnect;

  const { connectAsync: connectWagmi } = useConnectWagmi();
  const { reconnectAsync: reconnectWagmi } = useReconnectWagmi();
  const { connectAsync: connectGraz } = useConnectGraz();
  const [evmDerivedAddresses] = useLocalStorage({
    key: LocalStorageKey.EvmDerivedAddresses,
    defaultValue: {} as EvmDerivedAddresses,
  });
  const { ready, authenticated } = usePrivy();

  const { mfaMethods } = useMfa();
  const { showMfaEnrollmentModal } = useMfaEnrollment();

  const { login } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated) => {
      if (!wasAlreadyAuthenticated && isNewUser && mfaMethods.length) {
        showMfaEnrollmentModal();
      }
    },
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
      walletType: wType,
      forceConnect,
      isAccountConnected,
    }: {
      walletType?: WalletType;
      forceConnect?: boolean;
      isAccountConnected?: boolean;
    }) => {
      if (!wType) return { walletType: wType, walletConnectionType };

      const walletConnection = getWalletConnection({ walletType: wType });

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
          }[wType];

          if (!cosmosWalletType) {
            throw new Error(`${stringGetter({ key: wallets[wType].stringKey })} was not found.`);
          }

          if (!isConnectedGraz) {
            await connectGraz({
              chainId: SUPPORTED_COSMOS_CHAINS,
              walletType: cosmosWalletType,
            });
          }
        } else if (walletConnection.type === WalletConnectionType.TestWallet) {
          saveEvmAddress(STRING_KEYS.TEST_WALLET as EvmAddress);
        } else {
          // if account connected (via remember me), do not show wagmi popup until forceConnect
          if (!isConnectedWagmi && (!!forceConnect || !isAccountConnected)) {
            await connectWagmi({
              connector: resolveWagmiConnector({
                walletType: wType,
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
        walletType: wType,
        walletConnectionType: walletConnection?.type,
      };
    },
    [isConnectedGraz, isConnectedWagmi, signerWagmi, ready, authenticated, login]
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

  const disconnectSelectedWallet = useCallback(async () => {
    setSelectedWalletType(undefined);
    setWalletType(undefined);
    setWalletConnectionType(undefined);

    await disconnectWallet();
  }, [setSelectedWalletType, setWalletType, setWalletConnectionType, disconnectWallet]);

  useEffect(() => {
    (async () => {
      setSelectedWalletError(undefined);

      if (selectedWalletType) {
        const walletConnection = getWalletConnection({ walletType: selectedWalletType });
        setWalletType(selectedWalletType);
        setWalletConnectionType(walletConnection?.type);
        const isAccountConnected =
          evmAddress && evmDerivedAddresses[evmAddress]?.encryptedSignature;
        if (
          walletConnection &&
          walletConnection.type !== WalletConnectionType.Privy &&
          walletConnection.type !== WalletConnectionType.CosmosSigner &&
          walletConnection.type !== WalletConnectionType.TestWallet &&
          !isConnectedWagmi &&
          !isAccountConnected
        ) {
          await reconnectWagmi({
            connectors: [
              resolveWagmiConnector({
                walletType: selectedWalletType,
                walletConnection,
                walletConnectConfig,
              }),
            ],
          });
        }
      }
    })();
  }, [
    selectedWalletType,
    signerWagmi,
    evmDerivedAddresses,
    evmAddress,
    reconnectWagmi,
    setWalletType,
    setWalletConnectionType,
    isConnectedWagmi,
    walletConnectConfig,
  ]);

  const selectWalletType = useCallback(
    async (wType: WalletType | undefined) => {
      if (selectedWalletType) {
        setSelectedWalletType(undefined);
        await disconnectSelectedWallet();
        await new Promise(requestAnimationFrame);
      }

      setSelectedWalletType(wType);
      if (wType) {
        try {
          const { walletConnectionType: wConnectionType } = await connectWallet({
            walletType: wType,
            isAccountConnected: Boolean(
              evmAddress && evmDerivedAddresses[evmAddress]?.encryptedSignature
            ),
          });

          setWalletType(wType);
          setWalletConnectionType(wConnectionType);
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
    },
    [
      selectedWalletType,
      disconnectSelectedWallet,
      connectWallet,
      evmAddress,
      evmDerivedAddresses,
      setWalletType,
      setWalletConnectionType,
      stringGetter,
    ]
  );

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
    isConnectedGraz,
    getCosmosOfflineSigner,
  };
};
