import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import {
  type WalletConnection,
  wallets,
  WalletConnectionType,
  WalletErrorType,
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

      case WalletConnectionType.TestWallet: {
        return {
          type: WalletConnectionType.TestWallet,
        };
      }
    }
  }
};

export const getWalletErrorType = ({ error }: { error: Error }) => {
  const { message } = error;
  const messageLower = message.toLowerCase();

  // General - Cancelled
  if (
    messageLower.includes('connection request reset') ||
    messageLower.includes('rejected') ||
    messageLower.includes('reject') ||
    messageLower.includes('cancelled') ||
    messageLower.includes('canceled') ||
    messageLower.includes('user denied')
  ) {
    return WalletErrorType.UserCanceled;
  }

  if (messageLower.includes('chain mismatch')) {
    return WalletErrorType.ChainMismatch;
  }

  // ImToken - User canceled
  if (messageLower.includes('用户取消了操作')) {
    return WalletErrorType.UserCanceled;
  }

  if (messageLower.includes('does not support deterministic signing')) {
    return WalletErrorType.NonDeterministicWallet;
  }

  return WalletErrorType.Unknown;
};

export const parseWalletError = ({
  error,
  stringGetter,
}: {
  error: Error;
  stringGetter: StringGetterFunction;
}) => {
  const walletErrorType = getWalletErrorType({ error });
  let message;

  switch (walletErrorType) {
    case WalletErrorType.ChainMismatch:
    case WalletErrorType.UserCanceled: {
      break;
    }
    default: {
      message = stringGetter({
        key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
        params: {
          ERROR_MESSAGE: error.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
        },
      });
    }
  }

  return {
    walletErrorType,
    message,
  };
};
