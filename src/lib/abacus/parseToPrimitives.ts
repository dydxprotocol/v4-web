import Long from 'long';

import { bytesToBigInt } from '../numbers';

type ToPrimitives<T> = T extends Long | Uint8Array | Date | bigint
  ? string
  : T extends Array<infer U>
    ? Array<ToPrimitives<U>>
    : T extends object
      ? {
          [K in keyof T]: ToPrimitives<T[K]>;
        }
      : T;

export function parseToPrimitives<T>(x: T): ToPrimitives<T> {
  if (typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean' || x == null) {
    return x as any;
  }

  if (Array.isArray(x)) {
    return x.map((item) => parseToPrimitives(item)) as any;
  }

  if (Long.isLong(x)) {
    return x.toString() as any;
  }

  if (x instanceof Uint8Array) {
    return bytesToBigInt(x).toString() as any;
  }

  if (x instanceof Date) {
    return x.toString() as any;
  }

  if (typeof x === 'object') {
    const parsedObj: { [key: string]: any } = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const key in x) {
      if (Object.prototype.hasOwnProperty.call(x, key)) {
        parsedObj[key] = parseToPrimitives((x as any)[key]);
      }
    }
    return parsedObj as any;
  }

  if (typeof x === 'bigint') {
    return x.toString() as any;
  }

  throw new Error(`Unsupported data type: ${typeof x}`);
}
