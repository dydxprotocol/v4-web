import { useCallback, useEffect, useState } from 'react';

import { useLogin, useLogout, useMfa, useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import {
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
import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import { LocalStorageKey } from '@/constants/localStorage';
import { WALLETS_CONFIG_MAP } from '@/constants/networks';
import { ConnectorType, WalletInfo, WalletNetworkType, WalletType } from '@/constants/wallets';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { clearSourceAccount, setSourceAddress, setWalletInfo } from '@/state/wallet';
import { getSourceAccount } from '@/state/walletSelectors';

import { log } from '@/lib/telemetry';
import { testFlags } from '@/lib/testFlags';
import { isWagmiConnectorType, isWagmiResolvedWallet, resolveWagmiConnector } from '@/lib/wagmi';
import { parseWalletError } from '@/lib/wallet';

import { useStringGetter } from './useStringGetter';

export const useWalletConnection = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { address: evmAddressWagmi, isConnected: isConnectedWagmi } = useAccountWagmi();
  const publicClientWagmi = usePublicClientWagmi();
  const { data: signerWagmi } = useWalletClientWagmi();
  const { disconnectAsync: disconnectWagmi } = useDisconnectWagmi();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const {
    solAddress: solAddressPhantom,
    connect: connectPhantom,
    disconnect: disconnectPhantom,
  } = usePhantomWallet();

  const { data: dydxAccountGraz, isConnected: isConnectedGraz } = useAccountGraz({
    chainId: SUPPORTED_COSMOS_CHAINS,
    multiChain: true,
  });
  const dydxAddressGraz = isConnectedGraz
    ? dydxAccountGraz?.[selectedDydxChainId]?.bech32Address
    : undefined;

  const sourceAccount = useAppSelector(getSourceAccount);

  // Save the connected wallet address in Redux so we can show source wallet details even if the user disconnects from their wallet
  useEffect(() => {
    const walletInfo = sourceAccount.walletInfo;
    if (!walletInfo) return;

    if (isWagmiResolvedWallet(walletInfo) && evmAddressWagmi) {
      dispatch(setSourceAddress({ address: evmAddressWagmi, chain: WalletNetworkType.Evm }));
    } else if (walletInfo.connectorType === ConnectorType.PhantomSolana && solAddressPhantom) {
      dispatch(setSourceAddress({ address: solAddressPhantom, chain: WalletNetworkType.Solana }));
    } else if (walletInfo.connectorType === ConnectorType.Cosmos && dydxAddressGraz) {
      dispatch(setSourceAddress({ address: dydxAddressGraz, chain: WalletNetworkType.Cosmos }));
    }
  }, [sourceAccount.walletInfo, evmAddressWagmi, solAddressPhantom, dydxAddressGraz, dispatch]);

  const { disconnectAsync: disconnectGraz } = useDisconnectGraz();

  const getCosmosOfflineSigner = useCallback(
    async (chainId: string) => {
      if (isConnectedGraz) {
        const keplr = window.keplr;

        const offlineSigner = await keplr?.getOfflineSigner(chainId);

        return offlineSigner;
      }

      return undefined;
    },
    [isConnectedGraz]
  );

  // The user's current wallet selection - default to last time's selection
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | undefined>(
    sourceAccount.walletInfo
  );

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
            await connectGraz({
              chainId: SUPPORTED_COSMOS_CHAINS,
              walletType: wallet.name,
            });
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
    [isConnectedGraz, isConnectedWagmi, signerWagmi, ready, authenticated, login, connectPhantom]
  );

  const disconnectWallet = useCallback(async () => {
    setSelectedWallet(undefined);
    dispatch(clearSourceAccount());

    if (isConnectedWagmi) await disconnectWagmi();
    if (isConnectedGraz) await disconnectGraz();
    if (authenticated) await logout();
    if (solAddressPhantom) await disconnectPhantom();
  }, [
    dispatch,
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

  // Auto-reconnect to wallet from last browser session
  useEffect(() => {
    (async () => {
      setSelectedWalletError(undefined);

      if (selectedWallet) {
        const isEvmAccountConnected =
          sourceAccount.chain === WalletNetworkType.Evm && sourceAccount.encryptedSignature;
        if (isWagmiConnectorType(selectedWallet) && !isConnectedWagmi && !isEvmAccountConnected) {
          const connector = resolveWagmiConnector({ wallet: selectedWallet, walletConnectConfig });
          if (!connector) return;

          await reconnectWagmi({
            connectors: [connector],
          });
        } else if (
          selectedWallet.connectorType === ConnectorType.PhantomSolana &&
          !sourceAccount.address
        ) {
          await connectPhantom();
        }
      }
    })();
  }, [
    selectedWallet,
    signerWagmi,
    evmDerivedAddresses,
    sourceAccount,
    reconnectWagmi,
    isConnectedWagmi,
    walletConnectConfig,
    connectPhantom,
  ]);

  const selectWallet = useCallback(
    async (wallet: WalletInfo | undefined) => {
      if (wallet) {
        await disconnectWallet();
        await new Promise(requestAnimationFrame);
      }

      setSelectedWallet(wallet);
      if (wallet) {
        try {
          await connectWallet({
            wallet,
            isEvmAccountConnected: Boolean(
              sourceAccount.chain === WalletNetworkType.Evm && sourceAccount.encryptedSignature
            ),
          });
          dispatch(setWalletInfo(wallet));
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
        await disconnectWallet();
      }
    },
    [
      connectWallet,
      disconnectWallet,
      dispatch,
      sourceAccount.chain,
      sourceAccount.encryptedSignature,
      stringGetter,
    ]
  );

  // On page load, if testFlag.address is set, connect to the test wallet.
  useEffect(() => {
    if (testFlags.addressOverride) {
      dispatch(setWalletInfo({ connectorType: ConnectorType.Test, name: WalletType.TestWallet }));
      dispatch(
        setSourceAddress({ address: testFlags.addressOverride, chain: WalletNetworkType.Cosmos })
      );
    }
  }, [dispatch]);

  return {
    // Wallet selection
    selectWallet,
    selectedWallet,
    selectedWalletError,

    // Wallet connection (EVM)
    signerWagmi,
    publicClientWagmi,
    isConnectedWagmi,

    connectWallet,

    // Wallet connection (Cosmos)
    dydxAccountGraz,
    isConnectedGraz,
    getCosmosOfflineSigner,
  };
};
