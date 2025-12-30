import type { DecimalValue, DecimalValueCtor } from '../models/decimalValue';

/**
 * Test helper to create decimal values from float numbers
 */
export function createDecimal<T extends DecimalValue>(
  Constructor: DecimalValueCtor<T> & { fromFloat: (value: number) => T },
  floatValue: number
): T {
  return Constructor.fromFloat(floatValue);
}

/**
 * Test helper to create decimal values from bigint
 */
export function createDecimalFromBigInt<T extends DecimalValue>(
  Constructor: DecimalValueCtor<T> & { fromBigInt: (value: bigint) => T },
  value: bigint
): T {
  return Constructor.fromBigInt(value);
}

/**
 * Assert two decimal values are equal
 */
export function assertDecimalEqual<T extends DecimalValue>(
  actual: T,
  expected: T,
  message?: string
): void {
  if (actual.value !== expected.value || actual.decimals !== expected.decimals) {
    const actualFloat = actual.toFloat();
    const expectedFloat = expected.toFloat();
    throw new Error(
      message ||
        `Expected ${expectedFloat} (${expected.value} with ${expected.decimals} decimals), got ${actualFloat} (${actual.value} with ${actual.decimals} decimals)`
    );
  }
}

/**
 * Assert two decimal values are approximately equal (within tolerance)
 */
export function assertDecimalApprox<T extends DecimalValue>(
  actual: T,
  expected: T,
  tolerance = 0.0001,
  message?: string
): void {
  const actualFloat = actual.toFloat();
  const expectedFloat = expected.toFloat();
  const diff = Math.abs(actualFloat - expectedFloat);

  if (diff > tolerance) {
    throw new Error(
      message ||
        `Expected ${expectedFloat} ± ${tolerance}, got ${actualFloat} (difference: ${diff})`
    );
  }
}
