import { ConnectorType } from '@/constants/wallets';

import { STRING_KEYS } from './localization';

export type ErrorParams =
  | {
      errorStringKey: string;
      errorMessage?: string;
    }
  | {
      errorStringKey?: string;
      errorMessage: string;
    };

export const DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS = {
  errorStringKey: STRING_KEYS.SOMETHING_WENT_WRONG,
};

/**
 * Dydx has an interface for errors that includes more accessible properties than the generic ts error interface
 * The generic interface only has name, message, and stack.
 * This interface includes an optional code and walletConnectionType as well.
 */
export interface DydxError extends Error {
  code?: string | number;
  walletConnectorType?: ConnectorType;
}
