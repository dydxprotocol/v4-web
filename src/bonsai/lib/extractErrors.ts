import { STRING_KEY_VALUES, STRING_KEYS } from '@/constants/localization';

import { calc } from '@/lib/do';

import { logBonsaiError, logBonsaiInfo } from '../logs';

export interface ParsingError {
  message: string;
  stringKey?: string | null;
}

enum SubaccountUpdateFailedResult {
  NewlyUndercollateralized = 'NewlyUndercollateralized',
  StillUndercollateralized = 'StillUndercollateralized',
  WithdrawalsAndTransfersBlocked = 'WithdrawalsAndTransfersBlocked',
  UpdateCausedError = 'UpdateCausedError',
  ViolatesIsolatedSubaccountConstraints = 'ViolatesIsolatedSubaccountConstraints',
}

const QUERY_RESULT_ERROR_PREFIX = 'Query failed';
const FAILED_SUBACCOUNT_UPDATE_RESULT_PATTERN =
  /Subaccount with id \{[^}]+\} failed with UpdateResult:\s*([A-Za-z]+):/;

const parseSubaccountUpdateError = (message: string): ParsingError | null => {
  if (message.indexOf('not within valid time window: incorrect account sequence') >= 0) {
    return {
      message: 'Invalid timestamp nonce',
      stringKey: STRING_KEYS.BROADCAST_ERROR_SDK_32,
    };
  }

  if (message.indexOf('Invalid transfer amount with gas used') >= 0) {
    return {
      message: 'Invalid transfer amount',
      stringKey: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT,
    };
  }

  if (message.indexOf(': insufficent funds') >= 0) {
    return {
      message: 'Insufficient funds',
      stringKey: STRING_KEYS.INSUFFICIENT_BALANCE,
    };
  }

  const matchResult = message.match(FAILED_SUBACCOUNT_UPDATE_RESULT_PATTERN);
  if (!matchResult?.[1]) return null;

  const updateResult = matchResult[1] as keyof typeof SubaccountUpdateFailedResult;
  if (updateResult in SubaccountUpdateFailedResult) {
    return {
      message: `Subaccount update error: ${updateResult}`,
      stringKey: `ERRORS.QUERY_ERROR_SUBACCOUNTS_${updateResult.toUpperCase()}`,
    };
  }

  return null;
};

const parseQueryResultErrorFromMessage = (message: string): ParsingError => {
  // Workaround: Regex match different query results until protocol can return codespace/code
  const subaccountError = parseSubaccountUpdateError(message);
  if (subaccountError) return subaccountError;

  return {
    message: 'Unknown query result error',
    stringKey: null,
  };
};

const error = (code?: number, message?: string, codespace?: string): ParsingError | undefined => {
  if (code !== undefined) {
    if (code !== 0 && codespace) {
      return {
        message: message ?? 'Unknown error',
        stringKey: `ERRORS.BROADCAST_ERROR_${codespace.toUpperCase()}_${code}`,
      };
    }
    return undefined;
  }
  if (message?.startsWith(QUERY_RESULT_ERROR_PREFIX)) {
    return parseQueryResultErrorFromMessage(message);
  }
  if (message === 'Request rejected') {
    return {
      message,
      stringKey: STRING_KEYS.USER_REJECTED,
    };
  }
  if ((message?.indexOf('Bad status on response: 5') ?? -1) >= 0) {
    return { message: message ?? 'Validator error', stringKey: STRING_KEYS.VALIDATOR_RESPONSE_500 };
  }
  if (
    message === 'client not initialized' ||
    message === 'Missing compositeClient or localWallet'
  ) {
    return {
      message,
      stringKey: STRING_KEYS.NETWORKING_ERROR,
    };
  }
  if (message === 'Extension context invalidated.') {
    return {
      message,
      stringKey: STRING_KEYS.WALLET_CONTEXT_INVALIDATED,
    };
  }
  if (
    message === 'Failed to fetch' ||
    message === 'Load failed' ||
    message === 'NetworkError when attempting to fetch resource.'
  ) {
    return {
      message,
      stringKey: STRING_KEYS.NETWORKING_ERROR,
    };
  }
  if (
    (message?.indexOf(
      'was submitted but was not yet found on the chain. You might want to check later. Query timed out after'
    ) ?? -1) >= 0
  ) {
    return {
      message: 'Operation timed out',
      stringKey: STRING_KEYS.FAILED_COMMIT_CONFIRMATION,
    };
  }
  return {
    message: message ?? 'Unknown error',
    stringKey: null,
  };
};

interface TransactionError {
  message?: string;
  code?: number;
  codespace?: string;
}

export const parseTransactionError = (
  operationNameForLogging: string,
  response: string | undefined
): ParsingError | undefined => {
  if (response == null) {
    return undefined;
  }
  const attemptedParseJson = calc((): ParsingError | undefined => {
    try {
      const result = JSON.parse(response);

      if (result && typeof result === 'object') {
        const errorData = result.error as TransactionError | undefined;

        if (errorData != null && typeof errorData === 'object') {
          return error(errorData.code, errorData.message, errorData.codespace);
        }

        const maybeMessage = result.message;
        if (maybeMessage != null && typeof maybeMessage === 'string') {
          return error(undefined, maybeMessage);
        }

        return undefined;
      }

      return undefined;
    } catch {
      // is not json
      if (response.startsWith('429:')) {
        return {
          message: '429 - Too many requests',
          stringKey: STRING_KEYS.ERROR_MANY_REQUESTS,
        };
      }
      return undefined;
    }
  });
  if (
    attemptedParseJson?.stringKey == null ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    STRING_KEY_VALUES[attemptedParseJson?.stringKey] == null
  ) {
    logBonsaiError('parseTransactionError', `Failed to parse a ${operationNameForLogging} error`, {
      input: response,
      output: attemptedParseJson,
      stringKey: attemptedParseJson?.stringKey,
    });
    return {
      message: attemptedParseJson?.message ?? response,
      stringKey: undefined,
    };
  }
  logBonsaiInfo('parseTransactionError', `Successfully parsed a ${operationNameForLogging} error`, {
    input: response,
    output: attemptedParseJson,
  });
  return attemptedParseJson;
};
