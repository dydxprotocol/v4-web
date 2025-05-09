/**
 * Interface for objects with a toNumber method (like BigNumber)
 */
interface BigNumberLike {
  toNumber: () => number;
}

/**
 * Type guard to check if an object is BigNumber-like
 */
function isBigNumberLike(obj: unknown): obj is BigNumberLike {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'toNumber' in obj &&
    typeof (obj as any).toNumber === 'function'
  );
}

/**
 * Recursive type that converts BigNumberLike to number at all levels
 */
export type ConvertBigNumberToNumber<T> = T extends BigNumberLike
  ? number
  : T extends Array<infer U>
    ? Array<ConvertBigNumberToNumber<U>>
    : T extends object
      ? { [K in keyof T]: ConvertBigNumberToNumber<T[K]> }
      : T;

/**
 * Recursively converts BigNumber objects to numbers in an object structure
 * @param obj - The value to process (object, array, or primitive)
 * @returns A new value with all BigNumber instances converted to numbers
 */
export function purgeBigNumbers<T>(obj: T): ConvertBigNumberToNumber<T> | undefined {
  try {
    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return obj as any;
    }

    // Handle BigNumber directly
    if (isBigNumberLike(obj)) {
      return obj.toNumber() as any;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => purgeBigNumbers(item)) as any;
    }

    // Handle plain objects
    if (typeof obj === 'object' && obj.constructor === Object) {
      const result: Record<string, any> = {};

      // eslint-disable-next-line no-restricted-syntax
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = purgeBigNumbers((obj as Record<string, any>)[key]);
        }
      }

      return result as any;
    }

    // Return primitives and other types as is
    return obj as any;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return undefined;
  }
}
