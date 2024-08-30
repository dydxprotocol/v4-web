import { ResourceUnavailableRpcError } from 'viem';

import { DydxError } from '@/constants/errors';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { WalletErrorType } from '@/constants/wallets';

// Formatting
export const truncateAddress = (address?: string, prefix: string = 'dydx') => {
  if (!address) return '';
  const hash = address.replace(prefix, '');
  const firstHalf = hash.slice(0, 4);
  const secondHalf = hash.slice(-4);
  return `${prefix}${firstHalf}...${secondHalf}`;
};

const getWalletErrorType = ({ error }: { error: DydxError }) => {
  const { message, code } = error;
  const messageLower = message.toLowerCase();

  // Metamask - already pending request
  if (code === ResourceUnavailableRpcError.code) {
    return WalletErrorType.EipResourceUnavailable;
  }

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

  if (messageLower.includes('Missing or invalid. request() method: wallet_switchEthereumChain')) {
    return WalletErrorType.SwitchChainMethodMissing;
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

export const getErrorMessageForCode = (error: DydxError) => {
  const { code, message } = error;
  if (code === ResourceUnavailableRpcError.code) {
    // TODO: localize
    return 'Request already pending. Please complete in your wallet extension';
  }
  return message;
};

export const parseWalletError = ({
  error,
  stringGetter,
}: {
  error: DydxError;
  stringGetter: StringGetterFunction;
}) => {
  const walletErrorType = getWalletErrorType({ error });
  let message;
  let isErrorExpected;

  switch (walletErrorType) {
    case WalletErrorType.ChainMismatch:
    case WalletErrorType.UserCanceled:
    case WalletErrorType.SwitchChainMethodMissing: {
      isErrorExpected = true;
      message = error.message;
      break;
    }
    default: {
      isErrorExpected = false;
      message = stringGetter({
        key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
        params: {
          ERROR_MESSAGE:
            getErrorMessageForCode(error) || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
        },
      });
    }
  }
  return {
    walletErrorType,
    message,
    isErrorExpected,
  };
};
