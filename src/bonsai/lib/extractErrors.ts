import { STRING_KEY_VALUES, STRING_KEYS } from '@/constants/localization';

import { calc } from '@/lib/do';

import { logBonsaiError, logBonsaiInfo } from '../logs';

interface ParsingError {
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
  const matchResult = message.match(FAILED_SUBACCOUNT_UPDATE_RESULT_PATTERN);
  if (!matchResult?.[1]) return null;

  const updateResult = matchResult[1] as keyof typeof SubaccountUpdateFailedResult;
  if (updateResult in SubaccountUpdateFailedResult) {
    return {
      message: `Subaccount update error: ${updateResult}`,
      stringKey: `ERRORS.QUERY_ERROR_SUBACCOUNTS_${updateResult.toUpperCase()}`,
    };
  }
  if (
    message.indexOf('rpc error: code = Unknown desc = Invalid transfer amount with gas used') >= 0
  ) {
    return {
      message: 'Invalid transfer amount',
      stringKey: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT,
    };
  }
  if (message.indexOf('not within valid time window: incorrect account sequence') >= 0) {
    return {
      message: 'Invalid timestamp nonce',
      stringKey: STRING_KEYS.BROADCAST_ERROR_SDK_32,
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
  if (
    message === 'client not initialized' ||
    message === 'Missing compositeClient or localWallet'
  ) {
    return {
      message,
      stringKey: STRING_KEYS.NETWORKING_ERROR,
    };
  }
  if (message === 'Failed to fetch') {
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
      // not sure what to report yet
      stringKey: undefined,
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
    STRING_KEY_VALUES[attemptedParseJson?.stringKey] == null
  ) {
    logBonsaiError('parseTransactionError', `Failed to parse a ${operationNameForLogging} error`, {
      input: response,
      output: attemptedParseJson,
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
