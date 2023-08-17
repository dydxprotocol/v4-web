import {
  type WalletConnection,
  wallets,
  WalletConnectionType,
  WalletType,
} from '@/constants/wallets';

import { detectInjectedEip1193Providers } from './providers';

// Formatting
export const truncateAddress = (address?: string, prefix: string = 'dydx') => {
  if (!address) return '';
  const hash = address.replace(prefix, '');
  const firstHalf = hash.slice(0, 4);
  const secondHalf = hash.slice(-4);
  return `${prefix}${firstHalf}...${secondHalf}`;
};

// Wallet connections
export const getWalletConnection = ({
  walletType,
}: {
  walletType: WalletType;
}): WalletConnection | undefined => {
  const walletConfig = wallets[walletType];

  for (const connectionType of walletConfig.connectionTypes) {
    switch (connectionType) {
      case WalletConnectionType.InjectedEip1193: {
        for (const provider of detectInjectedEip1193Providers()) {
          if (walletConfig.matchesInjectedEip1193?.(provider)) {
            /* @ts-ignore */
            provider.autoRefreshOnNetworkChange = false;

            return {
              type: WalletConnectionType.InjectedEip1193,
              provider,
            };
          }
        }

        break;
      }

      case WalletConnectionType.WalletConnect1: {
        return {
          type: WalletConnectionType.WalletConnect1,
        };
      }

      case WalletConnectionType.WalletConnect2: {
        return {
          type: WalletConnectionType.WalletConnect2,
        };
      }

      case WalletConnectionType.CoinbaseWalletSdk: {
        return {
          type: WalletConnectionType.CoinbaseWalletSdk,
        };
      }

      case WalletConnectionType.CosmosSigner: {
        return {
          type: WalletConnectionType.CosmosSigner,
        };
      }
    }
  }
};
