import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import { OperationFailure, wrapOperationFailure } from '@/bonsai/lib/operationResult';

import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS, ErrorParams } from '@/constants/errors';

import { stringifyTransactionError } from './errors';

export function wrapSimpleError(source: string, message: string, stringKey: string | undefined) {
  const errorString = stringifyTransactionError({ message });
  if (stringKey != null) {
    return wrapOperationFailure(errorString, { message, stringKey });
  }
  return wrapOperationFailure(errorString, parseTransactionError(source, errorString));
}

export function operationFailureToErrorParams(result: OperationFailure): ErrorParams {
  return result.displayInfo != null
    ? {
        errorMessage: result.displayInfo.message,
        errorStringKey: result.displayInfo.stringKey ?? undefined,
      }
    : DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS;
}
