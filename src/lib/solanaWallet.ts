import { mnemonicToSeedSync } from '@scure/bip39';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';

/**
 * Derives a Solana keypair from mnemonic using Ed25519 SLIP-0010 derivation.
 *
 * Uses the standard Solana BIP44 path: `m/44'/501'/<accountIndex>'/0'`
 *
 * This implementation matches standard Solana wallets like Phantom, Solflare, etc.
 *
 * @param mnemonic - BIP39 mnemonic phrase (12 or 24 words)
 * @param accountIndex - Account index for HD derivation path (default: 0)
 * @returns Solana Keypair with derived keys
 */
export const deriveSolanaKeypairFromMnemonic = (
  mnemonic: string,
  accountIndex: number = 0
): Keypair => {
  // TODO: Move to v4-client-js to consolidate wallet derivation and reduce duplicate dependencies
  const seed = mnemonicToSeedSync(mnemonic);
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const seedHex = Buffer.from(seed).toString('hex');
  const derivedSeed = derivePath(path, seedHex).key;
  return Keypair.fromSeed(new Uint8Array(derivedSeed));
};
