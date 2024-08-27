import { useMemo } from 'react';

import { WalletType as CosmosWalletType } from 'graz';

import { isDev, isTestnet } from '@/constants/networks';

import { isTruthy } from '@/lib/isTruthy';
import { ConnectorType, DisplayWallet, WalletType } from '@/lib/wallet/types';

import { useMipdInjectedWallets } from './useMipdInjectedWallets';

export const useDisplayedWallets = (): DisplayWallet[] => {
  const injectedWallets = useMipdInjectedWallets();

  return useMemo(
    () =>
      [
        ...injectedWallets.map(
          (wallet) =>
            ({
              connectorType: ConnectorType.MIPD,
              icon: wallet.detail.info.icon,
              name: wallet.detail.info.name,
              rdns: wallet.detail.info.rdns,
            }) as DisplayWallet
        ),

        (isTestnet || isDev) && {
          connectorType: ConnectorType.Phantom,
          name: WalletType.Phantom,
        },

        isDev && {
          connectorType: ConnectorType.Cosmos,
          name: CosmosWalletType.KEPLR,
        },

        { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },

        { connectorType: ConnectorType.Coinbase, name: WalletType.CoinbaseWallet },

        { connectorType: ConnectorType.WalletConnect, name: WalletType.OkxWallet },

        Boolean(import.meta.env.VITE_PRIVY_APP_ID) && {
          connectorType: ConnectorType.Privy,
          name: WalletType.Privy,
        },

        { connectorType: ConnectorType.WalletConnect, name: WalletType.OtherWallet },
      ].filter(isTruthy) as DisplayWallet[],
    [injectedWallets]
  );
};
