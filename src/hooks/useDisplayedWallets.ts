import { useMemo } from 'react';

import { WalletType as CosmosWalletType } from 'graz';

import { isDev, isTestnet } from '@/constants/networks';
import { OKX_MIPD_RDNS, PHANTOM_MIPD_RDNS } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';
import { ConnectorType, WalletInfo, WalletType } from '@/lib/wallet/types';

import { useMipdInjectedWallets } from './useMipdInjectedWallets';

export const useDisplayedWallets = (): WalletInfo[] => {
  const injectedWallets = useMipdInjectedWallets();

  return useMemo(() => {
    const phantomDetected =
      injectedWallets.findIndex((wallet) => wallet.detail.info.rdns === PHANTOM_MIPD_RDNS) !== -1;

    const okxDetected =
      injectedWallets.findIndex((wallet) => wallet.detail.info.rdns === OKX_MIPD_RDNS) !== -1;

    return [
      ...injectedWallets
        // Remove Phantom EVM support, but enable Phantom Solana support based on EIP-6963 detection
        .filter((wallet) => wallet.detail.info.rdns !== PHANTOM_MIPD_RDNS)
        .map(
          (wallet) =>
            ({
              connectorType: ConnectorType.MIPD,
              icon: wallet.detail.info.icon,
              name: wallet.detail.info.name,
              rdns: wallet.detail.info.rdns,
            }) as WalletInfo
        ),

      (isTestnet || isDev) &&
        phantomDetected && {
          connectorType: ConnectorType.Phantom,
          name: WalletType.Phantom,
        },

      isDev && {
        connectorType: ConnectorType.Cosmos,
        name: CosmosWalletType.KEPLR,
      },

      { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },

      { connectorType: ConnectorType.Coinbase, name: WalletType.CoinbaseWallet },

      // No need to special-case an OKX WalletConnect option if the OKX extension wallet is already detected.
      // Note that OKX mobile app users can still connect through the generic WalletConnect option
      !okxDetected && { connectorType: ConnectorType.WalletConnect, name: WalletType.OkxWallet },

      Boolean(import.meta.env.VITE_PRIVY_APP_ID) && {
        connectorType: ConnectorType.Privy,
        name: WalletType.Privy,
      },

      { connectorType: ConnectorType.WalletConnect, name: WalletType.OtherWallet },
    ].filter(isTruthy) as WalletInfo[];
  }, [injectedWallets]);
};
