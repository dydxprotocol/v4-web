import { useCallback } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import type { LocalWallet } from '@dydxprotocol/v4-client-js';

import { getNeutronChainId, getOsmosisChainId } from '@/constants/graz';
import type { PrivateInformation } from '@/constants/wallets';

import {
  deriveCosmosWallet,
  deriveCosmosWalletFromPrivateKey,
  deriveCosmosWalletFromSigner,
} from '@/lib/onboarding/deriveCosmosWallets';

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
   * Get Osmosis wallet on-demand
   */
  const getOsmosisWallet = useCallback(async (): Promise<LocalWallet | null> => {
    if (hdKey?.mnemonic) {
      try {
        return await deriveCosmosWallet(hdKey.mnemonic, 'osmosis');
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Osmosis wallet w/ mnemonic', {
          error,
        });
      }
    }

    if (hdKey?.privateKey) {
      try {
        return await deriveCosmosWalletFromPrivateKey(
          Buffer.from(hdKey.privateKey).toString('hex'),
          'osmosis'
        );
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Osmosis wallet w/ private key', {
          error,
        });
      }
    }

    if (getCosmosOfflineSigner) {
      try {
        const osmosisOfflineSigner = await getCosmosOfflineSigner(getOsmosisChainId());
        if (osmosisOfflineSigner) {
          return await deriveCosmosWalletFromSigner(osmosisOfflineSigner, 'osmosis');
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }, [hdKey?.mnemonic, hdKey?.privateKey, getCosmosOfflineSigner]);

  /**
   * Get Neutron wallet on-demand
   */
  const getNeutronWallet = useCallback(async (): Promise<LocalWallet | null> => {
    if (hdKey?.mnemonic) {
      try {
        return await deriveCosmosWallet(hdKey.mnemonic, 'neutron');
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Neutron wallet w/ mnemonic', {
          error,
        });
        return null;
      }
    }

    if (hdKey?.privateKey) {
      try {
        return await deriveCosmosWalletFromPrivateKey(
          Buffer.from(hdKey.privateKey).toString('hex'),
          'neutron'
        );
      } catch (error) {
        logBonsaiError('useCosmosWallets', 'Failed to derive Neutron wallet w/ private key', {
          error,
        });
        return null;
      }
    }

    if (getCosmosOfflineSigner) {
      try {
        const neutronOfflineSigner = await getCosmosOfflineSigner(getNeutronChainId());
        if (neutronOfflineSigner) {
          return await deriveCosmosWalletFromSigner(neutronOfflineSigner, 'neutron');
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }, [hdKey?.mnemonic, hdKey?.privateKey, getCosmosOfflineSigner]);

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
    getOsmosisWallet,
    getNeutronWallet,

    // Address getters (convenience methods)
    getOsmosisAddress,
    getNeutronAddress,
  };
}
