import { useCallback, useEffect, useState } from 'react';

import { LocalStorageKey } from '@/constants/localStorage';

import {
  type DydxAddress,
  type EthereumAddress,
  WalletConnectionType,
  WalletType,
  wallets,
  DYDX_CHAIN_INFO,
} from '@/constants/wallets';

import {
  useConnect as useConnectWagmi,
  useAccount as useAccountWagmi,
  useDisconnect as useDisconnectWagmi,
  useWalletClient as useWalletClientWagmi,
} from 'wagmi';
import {
  useSuggestChainAndConnect as useConnectGraz,
  useAccount as useAccountGraz,
  useDisconnect as useDisconnectGraz,
  useOfflineSigners as useOfflineSignersGraz,
  WalletType as CosmosWalletType,
} from 'graz';

import { resolveWagmiConnector } from '@/lib/wagmi';
import { getWalletConnection } from '@/lib/wallet';
import { log } from '@/lib/telemetry';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStringGetter } from './useStringGetter';

export const useWalletConnection = () => {
  const stringGetter = useStringGetter();

  // EVM wallet connection
  const [evmAddress, saveEvmAddress] = useLocalStorage<EthereumAddress | undefined>({
    key: LocalStorageKey.EvmAddress,
    defaultValue: undefined,
  });
  const { address: evmAddressWagmi, isConnected: isConnectedWagmi } = useAccountWagmi();
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

  const { connectAsync: connectWagmi } =
    walletType && walletConnectionType
      ? useConnectWagmi({
          connector: resolveWagmiConnector({
            walletType,
            walletConnection: {
              type: walletConnectionType,
            },
          }),
        })
      : useConnectWagmi();
  const { suggestAndConnect: connectGraz } = useConnectGraz();

  const connectWallet = useCallback(
    async ({ walletType }: { walletType: WalletType }) => {
      const walletConnection = getWalletConnection({ walletType });

      try {
        if (!walletConnection) {
          throw new Error('Onboarding: No wallet connection found.');
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
        } else {
          if (!isConnectedWagmi) {
            await connectWagmi({
              connector: resolveWagmiConnector({
                walletType,
                walletConnection,
              }),
            });
          }
        }
      } catch (error) {
        log('useWalletConnection/connectWallet', error);

        throw Object.assign(
          new Error([error.message, error.cause?.message].filter(Boolean).join('\n')),
          {
            walletConnectionType: walletConnection?.type,
          }
        );
      }

      return {
        walletType,
        walletConnectionType: walletConnection.type,
      };
    },
    [isConnectedGraz, signerGraz, isConnectedWagmi, signerWagmi]
  );

  const disconnectWallet = useCallback(async () => {
    saveEvmAddress(undefined);
    saveDydxAddress(undefined);

    if (isConnectedWagmi) await disconnectWagmi();
    if (isConnectedGraz) await disconnectGraz();
  }, [isConnectedGraz, isConnectedWagmi]);

  // Wallet selection

  const [selectedWalletType, setSelectedWalletType] = useState<WalletType | undefined>(walletType);
  const [selectedWalletError, setSelectedWalletError] = useState<Error>();

  useEffect(() => {
    (async () => {
      setSelectedWalletError(undefined);

      if (selectedWalletType) {
        try {
          const { walletType, walletConnectionType } = await connectWallet({
            walletType: selectedWalletType,
          });

          setWalletType(walletType);
          setWalletConnectionType(walletConnectionType);
        } catch (error) {
          log('useWalletConnection/connectWallet', error);
          setSelectedWalletError(error);
        }
      } else {
        setWalletType(undefined);
        setWalletConnectionType(undefined);

        await disconnectWallet();
      }
    })();
  }, [selectedWalletType, signerWagmi, signerGraz]);

  const selectWalletType = async (walletType: WalletType | undefined) => {
    if (selectedWalletType) {
      setSelectedWalletType(undefined);
      await new Promise(requestAnimationFrame);
    }

    setSelectedWalletType(walletType);
  };

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

    // Wallet connection (Cosmos)
    dydxAddress,
    dydxAddressGraz,
    signerGraz,
  };
};
