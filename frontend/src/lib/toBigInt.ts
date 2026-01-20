export {};

function toBigInt(this: string): bigint {
  const trimmed = this.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) {
    throw new TypeError(`toBigInt: invalid integer string: '${this}'`);
  }
  return BigInt(trimmed);
}

String.prototype.toBigInt = toBigInt;

declare global {
  interface String {
    toBigInt(this: string): bigint;
  }
}
