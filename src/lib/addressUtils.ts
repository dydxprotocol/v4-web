import { fromBech32, fromHex, toBech32, toHex } from '@cosmjs/encoding';
import { PublicKey } from '@solana/web3.js';
import { getAddress, isAddress } from 'viem';

import { INJECTIVE_BECH32_PREFIX } from '@/constants/graz';

const ETH_ADDRESS_BYTE_LENGTH = 20;

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

export function validateInjectiveAddress(address: string) {
  try {
    const { prefix, data } = fromBech32(address);
    return prefix === INJECTIVE_BECH32_PREFIX && data.length === ETH_ADDRESS_BYTE_LENGTH;
  } catch (error) {
    return false;
  }
}

/**
 * Converts an Injective (inj) bech32 address to its Injective EVM (0x) address.
 * Injective accounts use ethsecp256k1 (coin type 60), so the bech32 data is the EVM address.
 * @warning Only pass Injective-derived addresses.
 */
export function getInjectiveEvmAddress(injectiveAddress: string): string {
  if (!validateInjectiveAddress(injectiveAddress)) {
    throw new Error(`Invalid injective address: ${injectiveAddress}`);
  }
  return getAddress(`0x${toHex(fromBech32(injectiveAddress).data)}`);
}

type MultiChainAddress =
  | { address?: string | null; network: 'cosmos'; prefix: string }
  | { address?: string | null; network: 'evm' }
  | { address?: string | null; network: 'solana' };

export function isValidSolanaAddress(address: string) {
  try {
    // Generating a publickey will demonstrate if an address is valid
    // eslint-disable-next-line no-new
    new PublicKey(address);
    return true;
  } catch (_e) {
    return false;
  }
}

// TODO: Add unit test once `isAddress` works with vitest
export function isValidAddress(input: MultiChainAddress): boolean {
  if (!input.address) return false;

  if (input.network === 'evm') {
    return isAddress(input.address, { strict: true }); // enable checksum matching
  }

  if (input.network === 'solana') {
    return isValidSolanaAddress(input.address);
  }

  if (input.prefix === INJECTIVE_BECH32_PREFIX) {
    return validateInjectiveAddress(input.address);
  }

  return validateCosmosAddress(input.address, input.prefix);
}
