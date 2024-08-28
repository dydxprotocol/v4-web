import { useCallback, useEffect, useState } from 'react';

import { useLogin, useLogout, useMfa, useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import {
  useAccount as useAccountGraz,
  useSuggestChainAndConnect as useConnectGraz,
  useDisconnect as useDisconnectGraz,
  useOfflineSigners as useOfflineSignersGraz,
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
import { WALLETS_CONFIG_MAP } from '@/constants/networks';
import {
  DYDX_CHAIN_INFO,
  type DydxAddress,
  type EvmAddress,
  SolAddress,
} from '@/constants/wallets';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { log } from '@/lib/telemetry';
import { testFlags } from '@/lib/testFlags';
import { isWagmiConnectorType, resolveWagmiConnector } from '@/lib/wagmi';
import { parseWalletError } from '@/lib/wallet';
import { ConnectorType, WalletInfo, WalletType } from '@/lib/wallet/types';

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

  const {
    solAddress: solAddressPhantom,
    connect: connectPhantom,
    disconnect: disconnectPhantom,
  } = usePhantomWallet();

  // SOL wallet connection
  const [solAddress, saveSolAddress] = useLocalStorage<SolAddress | undefined>({
    key: LocalStorageKey.SolAddress,
    defaultValue: undefined,
  });

  useEffect(() => {
    if (evmAddressWagmi) saveEvmAddress(evmAddressWagmi);
  }, [evmAddressWagmi]);

  useEffect(() => {
    if (solAddressPhantom) saveSolAddress(solAddressPhantom);
  }, [solAddressPhantom]);

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
  // The saved wallet connection from the last browser session
  const [connectedWallet, setConnectedWallet] = useLocalStorage<WalletInfo | undefined>({
    key: LocalStorageKey.OnboardingSelectedWallet,
    defaultValue: undefined,
  });
  // The user's current wallet selection - default to last time's selection
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | undefined>(connectedWallet);

  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const walletConnectConfig = WALLETS_CONFIG_MAP[selectedDydxChainId].walletconnect;

  const { connectAsync: connectWagmi } = useConnectWagmi();
  const { reconnectAsync: reconnectWagmi } = useReconnectWagmi();
  const { suggestAndConnect: connectGraz } = useConnectGraz();
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
      wallet,
      forceConnect,
      isEvmAccountConnected,
    }: {
      wallet: WalletInfo | undefined;
      forceConnect?: boolean;
      isEvmAccountConnected?: boolean;
    }) => {
      if (!wallet) return;

      try {
        if (wallet.connectorType === ConnectorType.Privy) {
          if (!isConnectedWagmi && ready && !authenticated) {
            login();
          }
        } else if (wallet.connectorType === ConnectorType.Cosmos) {
          if (!isConnectedGraz) {
            await connectGraz({ chainInfo: DYDX_CHAIN_INFO, walletType: wallet.name });
          }
        } else if (wallet.connectorType === ConnectorType.PhantomSolana) {
          await connectPhantom();
        } else if (isWagmiConnectorType(wallet)) {
          if (!isConnectedWagmi && (!!forceConnect || !isEvmAccountConnected)) {
            const connector = resolveWagmiConnector({ wallet, walletConnectConfig });
            // This could happen in the mipd case if the user has uninstalled or disabled the injected wallet they've previously selected
            // TODO: add analytics to see how often this happens?
            if (!connector) return;

            await connectWagmi({ connector });
          }
        }
      } catch (error) {
        const { isErrorExpected } = parseWalletError({ error, stringGetter });
        if (!isErrorExpected) {
          throw Object.assign(
            new Error([error.message, error.cause?.message].filter(Boolean).join('\n')),
            {
              // Currently the only usecase for this is piping in EIP specified error codes.
              // There's a nonzero chance of overlap so we should watch out for this
              code: error.code,
              connectorType: wallet?.connectorType,
            }
          );
        }
      }
    },
    [
      isConnectedWagmi,
      ready,
      authenticated,
      login,
      isConnectedGraz,
      connectGraz,
      connectPhantom,
      walletConnectConfig,
      connectWagmi,
      stringGetter,
    ]
  );

  const disconnectWallet = useCallback(async () => {
    saveEvmAddress(undefined);
    saveDydxAddress(undefined);
    saveSolAddress(undefined);

    if (isConnectedWagmi) await disconnectWagmi();
    if (isConnectedGraz) await disconnectGraz();
    if (authenticated) await logout();
    if (solAddressPhantom) await disconnectPhantom();
  }, [
    saveEvmAddress,
    saveDydxAddress,
    saveSolAddress,
    isConnectedWagmi,
    disconnectWagmi,
    isConnectedGraz,
    disconnectGraz,
    authenticated,
    logout,
    solAddressPhantom,
    disconnectPhantom,
  ]);

  // Wallet selection
  const [selectedWalletError, setSelectedWalletError] = useState<string>();

  const disconnectSelectedWallet = useCallback(async () => {
    setConnectedWallet(undefined);
    setSelectedWallet(undefined);

    await disconnectWallet();
  }, [setConnectedWallet, disconnectWallet]);

  // Auto-reconnect to wallet from last browser session
  useEffect(() => {
    (async () => {
      setSelectedWalletError(undefined);

      if (selectedWallet) {
        const isEvmAccountConnected =
          evmAddress && evmDerivedAddresses[evmAddress]?.encryptedSignature;
        if (isWagmiConnectorType(selectedWallet) && !isConnectedWagmi && !isEvmAccountConnected) {
          const connector = resolveWagmiConnector({ wallet: selectedWallet, walletConnectConfig });
          if (!connector) return;

          await reconnectWagmi({
            connectors: [connector],
          });
        } else if (selectedWallet.connectorType === ConnectorType.PhantomSolana && !solAddress) {
          await connectPhantom();
        }
      }
    })();
  }, [
    selectedWallet,
    signerWagmi,
    signerGraz,
    evmDerivedAddresses,
    evmAddress,
    reconnectWagmi,
    isConnectedWagmi,
    walletConnectConfig,
    connectPhantom,
    solAddress,
  ]);

  const selectWallet = useCallback(
    async (wallet: WalletInfo | undefined) => {
      if (wallet) {
        setSelectedWallet(undefined);
        await disconnectSelectedWallet();
        await new Promise(requestAnimationFrame);
      }

      setSelectedWallet(wallet);
      if (wallet) {
        try {
          await connectWallet({
            wallet,
            isEvmAccountConnected: Boolean(
              evmAddress && evmDerivedAddresses[evmAddress]?.encryptedSignature
            ),
          });
          setConnectedWallet(wallet);
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
      disconnectSelectedWallet,
      connectWallet,
      evmAddress,
      evmDerivedAddresses,
      setConnectedWallet,
      stringGetter,
    ]
  );

  // On page load, if testFlag.address is set, connect to the test wallet.
  useEffect(() => {
    (async () => {
      if (testFlags.addressOverride) {
        setSelectedWallet({ connectorType: ConnectorType.Test, name: WalletType.TestWallet });
      }
    })();
  }, []);

  return {
    // Wallet connection
    connectedWallet,

    // Wallet selection
    selectWallet,
    selectedWallet,
    selectedWalletError,

    // Wallet connection (EVM)
    evmAddress,
    evmAddressWagmi,
    signerWagmi,
    publicClientWagmi,
    isConnectedWagmi,
    connectWallet,

    // Wallet connection (sol)
    solAddress,

    // Wallet connection (Cosmos)
    dydxAddress,
    dydxAddressGraz,
    signerGraz,
  };
};
