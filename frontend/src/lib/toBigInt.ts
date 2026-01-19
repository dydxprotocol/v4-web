export {};

function toBigInt(this: string): bigint {
  return BigInt(this);
}

String.prototype.toBigInt = toBigInt;

declare global {
  interface String {
    toBigInt(this: string): bigint;
  }
}
