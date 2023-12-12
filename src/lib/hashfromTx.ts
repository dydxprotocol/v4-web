export const hashFromTx = (
  txHash: string | Uint8Array
): string => `0x${Buffer.from(txHash).toString('hex')}`;
