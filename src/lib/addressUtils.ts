import { fromBech32, fromHex, toBech32, toHex } from '@cosmjs/encoding';

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

/**
 * Validates a Cosmos address with a specific prefix.
 * @param {string} address The Cosmos address to validate.
 * @param {string} prefix The expected prefix for the address.
 * @returns {boolean} True if the address is valid and matches the prefix, false otherwise.
 */
export function validateCosmosAddress(address: string, prefix: string) {
  try {
    // Decode the address to verify its structure and prefix
    const { prefix: decodedPrefix } = fromBech32(address);

    // Check if the decoded address has the expected prefix
    return decodedPrefix === prefix;
  } catch (error) {
    // If decoding fails, the address is not valid
    return false;
  }
}
