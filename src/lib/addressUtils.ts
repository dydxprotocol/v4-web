import { fromBech32, toBech32, fromHex, toHex } from '@cosmjs/encoding';

// ============ Byte Helpers ============
export const stripHexPrefix = (input: string): string => {
  if (input.indexOf('0x') === 0) {
    return input.substring(2);
  }
  return input;
};

/**
 *
 * @params {
 *  @address cosmos network public address
 *  @bech32Prefix network to prepend (osmos, cosmos, axelar)
 * }
 * @returns new cosmos address with desired bech32 prefix
 */
export function convertBech32Address({
  address,
  bech32Prefix,
}: {
  address: string;
  bech32Prefix: string;
}): string {
  return toBech32(bech32Prefix, fromHex(toHex(fromBech32(address).data)));
}
