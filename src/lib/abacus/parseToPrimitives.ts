import Long from 'long';

import { bytesToBigInt } from '../numbers';

export function parseToPrimitives<T>(x: T): T {
  if (typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean' || x === null) {
    return x;
  }

  if (Array.isArray(x)) {
    return x.map((item) => parseToPrimitives(item)) as T;
  }

  if (Long.isLong(x)) {
    return x.toString() as T;
  }

  if (x instanceof Uint8Array) {
    return bytesToBigInt(x).toString() as T;
  }

  if (x instanceof Date) {
    return x.toString() as T;
  }

  if (typeof x === 'object') {
    const parsedObj: { [key: string]: any } = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const key in x) {
      if (Object.prototype.hasOwnProperty.call(x, key)) {
        parsedObj[key] = parseToPrimitives((x as any)[key]);
      }
    }
    return parsedObj as T;
  }

  if (typeof x === 'bigint') {
    return x.toString() as T;
  }

  throw new Error(`Unsupported data type: ${typeof x}`);
}
