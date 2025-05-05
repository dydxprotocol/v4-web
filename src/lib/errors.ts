import BigNumber from 'bignumber.js';
import Long from 'long';

import { bytesToBigInt } from './numbers';

/**
 * Error thrown if StatefulOrder includes an error code in it's response.
 */
export class StatefulOrderError extends Error {
  response: any;

  code: number;

  constructor(message: any, response: any) {
    super(message);
    this.name = 'StatefulOrderError';
    this.response = response;
    this.code = response.code;
  }
}

/**
 * Parse the stringified error and returns a ParseError.
 * BroadcastError is parsed with `code`, `codespace`, and `message`, and defaults to show the original error message if untranslated.
 * Failed Query results (i.e., those starting with "Query failed") are matched via the error message, defaulting to "Unknown query result error".
 * Unmatched errors will display the actual error message.
 */
export const stringifyTransactionError = (error: any): string => {
  // Check if the error is a broadcast error (i.e., from execution)
  if (error?.name === 'BroadcastError') {
    // Return the error as a JSON string
    return JSON.stringify({ error }, replaceFnThatHandlesBigInt);
  }

  // Handle a normal Error (i.e., from query/simulation or other errors)
  // An Error object is not fully serializable, so we need to extract the message and stack
  const serializedError: { [key: string]: any } = {
    message: error.message, // Extract the error message
    // in case this is a StatefulOrderError
    response: error.response,
    code: error.code,
  };

  return JSON.stringify({ error: serializedError }, replaceFnThatHandlesBigInt);
};

const replaceFnThatHandlesBigInt = (key: string, x: any) => {
  if (x == null) {
    return x;
  }

  if (Long.isLong(x) || x instanceof Long) {
    return x.toString();
  }

  if (x instanceof BigNumber) {
    return x.toString();
  }

  if (typeof x === 'bigint') {
    return x.toString();
  }

  const buffer = (x as any).buffer;
  if (buffer instanceof Uint8Array) {
    return bytesToBigInt(buffer).toString();
  }

  if (x instanceof Uint8Array) {
    return bytesToBigInt(x).toString();
  }

  return x;
};
