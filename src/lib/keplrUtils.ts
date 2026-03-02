import { onboarding } from '@dydxprotocol/v4-client-js';
import { keccak256 } from 'viem';

import { Hdkey } from '@/constants/account';

/**
 * Signs a message with Keplr
 * @param message - The message to sign
 * @param signer - The signer address
 * @param chainId - The chain ID
 * @returns The signature
 */
export const signMessageWithKeplr = async (
  message: string,
  signer: string,
  chainId: string
): Promise<string> => {
  if (!window.keplr) {
    throw new Error('Keplr not found');
  }

  const { signature } = await window.keplr.signArbitrary(chainId, signer, message);
  return signature;
};

/**
 *
 * @param signature - The signature to get the HD key from
 * @returns The HD key
 */
export const getHDKeyFromKeplrSignature = (signature: string): Hdkey => {
  if (!window.keplr) {
    throw new Error('Keplr not found');
  }

  const buffer = Buffer.from(signature, 'hex');
  const entropy = keccak256(buffer, 'bytes');
  return onboarding.exportMnemonicAndPrivateKey(entropy);
};
