import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { logBonsaiError } from '@/bonsai/logs';
import { LocalWallet, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';

import { NEUTRON_BECH32_PREFIX, OSMO_BECH32_PREFIX } from '@/constants/graz';

export type SupportedCosmosChain = 'noble' | 'osmosis' | 'neutron';

/**
 * Derive a Cosmos wallet on-demand from mnemonic
 * Used for Noble, Osmosis, Neutron wallets when needed
 *
 * @param mnemonic - The mnemonic to derive from
 * @param chain - Which Cosmos chain wallet to derive
 * @returns LocalWallet for the specified chain
 */
export async function deriveCosmosWallet(
  mnemonic: string,
  chain: SupportedCosmosChain
): Promise<LocalWallet | null> {
  try {
    const prefix = getCosmosPrefix(chain);
    const LazyLocalWallet = await getLazyLocalWallet();
    return await LazyLocalWallet.fromMnemonic(mnemonic, prefix);
  } catch (error) {
    logBonsaiError('OnboardingSupervisor', `Failed to derive ${chain} wallet from mnemonic`, {
      error,
    });

    return null;
  }
}

export async function deriveCosmosWalletFromPrivateKey(
  privateKey: string,
  chain: SupportedCosmosChain
): Promise<LocalWallet | null> {
  try {
    const prefix = getCosmosPrefix(chain);
    const LazyLocalWallet = await getLazyLocalWallet();
    return await LazyLocalWallet.fromPrivateKey(privateKey, prefix);
  } catch (error) {
    logBonsaiError('OnboardingSupervisor', `Failed to derive ${chain} wallet from private key`, {
      error,
    });

    return null;
  }
}

/**
 * Derive a Cosmos wallet from offline signer
 * Used when user has a native Cosmos wallet connected
 */
export async function deriveCosmosWalletFromSigner(
  offlineSigner: any,
  chain: string
): Promise<LocalWallet | null> {
  try {
    const LazyLocalWallet = await getLazyLocalWallet();
    return await LazyLocalWallet.fromOfflineSigner(offlineSigner);
  } catch (error) {
    logBonsaiError('OnboardingSupervisor', `Failed to derive ${chain} wallet from signer`, {
      error,
    });
    return null;
  }
}

/**
 * Get the Bech32 prefix for a Cosmos chain
 */
function getCosmosPrefix(chain: SupportedCosmosChain): string {
  switch (chain) {
    case 'noble':
      return NOBLE_BECH32_PREFIX;
    case 'osmosis':
      return OSMO_BECH32_PREFIX;
    case 'neutron':
      return NEUTRON_BECH32_PREFIX;
    default:
      throw new Error(`Unknown Cosmos chain: ${chain}`);
  }
}
