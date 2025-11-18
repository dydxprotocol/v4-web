import { useCallback } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import type { LocalWallet } from '@dydxprotocol/v4-client-js';

import { getNeutronChainId, getNobleChainId, getOsmosisChainId } from '@/constants/graz';
import type { PrivateInformation } from '@/constants/wallets';

import { onboardingManager } from '@/lib/onboarding/OnboardingSupervisor';

/**
 *
 * @param hdKey - The HD key material containing the mnemonic
 * @param getCosmosOfflineSigner - Function to get offline signer (for native Cosmos wallets)
 * @returns Functions to get Noble, Osmosis, and Neutron wallets
 */
export function useCosmosWallets(
  hdKey: PrivateInformation | undefined,
  getCosmosOfflineSigner?: (chainId: string) => Promise<any>
) {
  /**
   * Get Noble wallet on-demand
   */
  const getNobleWallet = useCallback(async (): Promise<LocalWallet | null> => {
    // Try to get from offline signer first (for native Cosmos wallets)
    if (getCosmosOfflineSigner) {
      try {
        const nobleOfflineSigner = await getCosmosOfflineSigner(getNobleChainId());
        if (nobleOfflineSigner) {
          return await onboardingManager.deriveCosmosWalletFromSigner(nobleOfflineSigner, 'noble');
        }
      } catch (error) {
        // Fall through to mnemonic derivation
      }
    }

    // Derive from mnemonic if available
    if (hdKey?.mnemonic) {
      try {
        return await onboardingManager.deriveCosmosWallet(hdKey.mnemonic, 'noble');
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Noble wallet w/ mnemonic', { error });
        return null;
      }
    }

    return null;
  }, [hdKey?.mnemonic, getCosmosOfflineSigner]);

  /**
   * Get Osmosis wallet on-demand
   */
  const getOsmosisWallet = useCallback(async (): Promise<LocalWallet | null> => {
    // Try to get from offline signer first (for native Cosmos wallets)
    if (getCosmosOfflineSigner) {
      try {
        const osmosisOfflineSigner = await getCosmosOfflineSigner(getOsmosisChainId());
        if (osmosisOfflineSigner) {
          return await onboardingManager.deriveCosmosWalletFromSigner(
            osmosisOfflineSigner,
            'osmosis'
          );
        }
      } catch (error) {
        // Fall through to mnemonic derivation
      }
    }

    // Derive from mnemonic if available
    if (hdKey?.mnemonic) {
      try {
        return await onboardingManager.deriveCosmosWallet(hdKey.mnemonic, 'osmosis');
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Osmosis wallet w/ mnemonic', {
          error,
        });

        return null;
      }
    }

    return null;
  }, [hdKey?.mnemonic, getCosmosOfflineSigner]);

  /**
   * Get Neutron wallet on-demand
   */
  const getNeutronWallet = useCallback(async (): Promise<LocalWallet | null> => {
    // Try to get from offline signer first (for native Cosmos wallets)
    if (getCosmosOfflineSigner) {
      try {
        const neutronOfflineSigner = await getCosmosOfflineSigner(getNeutronChainId());
        if (neutronOfflineSigner) {
          return await onboardingManager.deriveCosmosWalletFromSigner(
            neutronOfflineSigner,
            'neutron'
          );
        }
      } catch (error) {
        // Fall through to mnemonic derivation
      }
    }

    // Derive from mnemonic if available
    if (hdKey?.mnemonic) {
      try {
        return await onboardingManager.deriveCosmosWallet(hdKey.mnemonic, 'neutron');
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Neutron wallet w/ mnemonic', {
          error,
        });
        return null;
      }
    }

    return null;
  }, [hdKey?.mnemonic, getCosmosOfflineSigner]);

  /**
   * Get Noble wallet address without creating full wallet
   * Useful for display purposes
   */
  const getNobleAddress = useCallback(async (): Promise<string | null> => {
    const wallet = await getNobleWallet();
    return wallet?.address ?? null;
  }, [getNobleWallet]);

  /**
   * Get Osmosis wallet address without creating full wallet
   */
  const getOsmosisAddress = useCallback(async (): Promise<string | null> => {
    const wallet = await getOsmosisWallet();
    return wallet?.address ?? null;
  }, [getOsmosisWallet]);

  /**
   * Get Neutron wallet address without creating full wallet
   */
  const getNeutronAddress = useCallback(async (): Promise<string | null> => {
    const wallet = await getNeutronWallet();
    return wallet?.address ?? null;
  }, [getNeutronWallet]);

  return {
    // Wallet getters
    getNobleWallet,
    getOsmosisWallet,
    getNeutronWallet,

    // Address getters (convenience methods)
    getNobleAddress,
    getOsmosisAddress,
    getNeutronAddress,
  };
}
