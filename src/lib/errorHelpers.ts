import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import { OperationFailure, wrapOperationFailure } from '@/bonsai/lib/operationResult';

import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS, ErrorParams } from '@/constants/errors';

import { stringifyTransactionError } from './errors';

export function wrapSimpleError(source: string, message: string) {
  const errorString = stringifyTransactionError({ message });
  const parsed = parseTransactionError(source, errorString);
  return wrapOperationFailure(errorString, parsed);
}

export function operationFailureToErrorParams(result: OperationFailure): ErrorParams {
  return result.displayInfo != null
    ? {
        errorMessage: result.displayInfo.message,
        errorStringKey: result.displayInfo.stringKey ?? undefined,
      }
    : DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS;
}
