import { fromBech32, fromHex, toBech32, toHex } from '@cosmjs/encoding';
import { isAddress } from 'viem';

/**
 *
 * @params {
 *  @address cosmos network public address
 *  @bech32Prefix network to prepend (osmos, cosmos)
 * }
 * @warning do not use this function for Evm-Compatible chain(Axelar, Evmos, etc.)
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

type MultiChainAddress =
  | { address?: string | null; network: 'cosmos'; prefix: string }
  | { address?: string | null; network: 'evm' };

// TODO: Add unit test once `isAddress` works with vitest
export function isValidAddress(input: MultiChainAddress): boolean {
  if (!input.address) return false;

  if (input.network === 'evm') {
    return isAddress(input.address, { strict: true }); // enable checksum matching
  }

  return validateCosmosAddress(input.address, input.prefix);
}
