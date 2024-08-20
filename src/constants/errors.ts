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

export enum MetamaskErrorCodes {
  // https://blog.logrocket.com/understanding-resolving-metamask-error-codes/#32002
  RESOURCE_UNAVAILABLE = -32002,
}
