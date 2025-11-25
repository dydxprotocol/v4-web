import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BECH32_PREFIX, onboarding, type LocalWallet } from '@dydxprotocol/v4-client-js';

import { OnboardingState } from '@/constants/account';
import { DydxAddress, PrivateInformation } from '@/constants/wallets';

import { store } from '@/state/_store';
import { setOnboardingState } from '@/state/account';
import { setLocalWallet } from '@/state/wallet';

import { hdKeyManager } from '@/lib/hdKeyManager';
import { log } from '@/lib/telemetry';

import { secureStorage } from './secureStorage';

const STORAGE_KEY = 'trading_wallet_key';

export interface WalletCreationResult {
  success: boolean;
  dydxAddress?: DydxAddress;
  error?: string;
}

export class DydxWalletService {
  /**
   * Import wallet from private key
   * Direct private key import without mnemonic
   *
   * @param privateKey - Private key as hex string (with or without 0x prefix)
   * @param persist - Whether to store for future sessions
   * @returns Wallet creation result with dYdX address
   */
  async importFromPrivateKey(
    privateKey: string,
    persist: boolean = true
  ): Promise<WalletCreationResult> {
    try {
      // Create wallet from private key
      const LocalWallet = await getLazyLocalWallet();
      const wallet = await LocalWallet.fromPrivateKey(privateKey);

      if (!wallet.address) {
        return {
          success: false,
          error: 'Failed to create wallet from private key.',
        };
      }

      // Note: Private key imports don't have mnemonic, so we can't derive Cosmos wallets
      // Store the private key directly
      if (persist) {
        await secureStorage.store(STORAGE_KEY, privateKey);
      }

      // Update app state (no hdKey material for private key imports)
      await this.setWalletInState(wallet, ''); // Empty string for mnemonic

      logBonsaiInfo('DydxWalletService', 'importFromPrivateKey', {
        address: wallet.address,
        persisted: persist,
      });

      return {
        success: true,
        dydxAddress: wallet.address as DydxAddress,
      };
    } catch (error) {
      logBonsaiError('DydxWalletService', 'Failed to importFromPrivateKey', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Restore wallet from previously stored mnemonic
   * Called on app initialization to restore session
   *
   * @returns Wallet creation result or null if no stored mnemonic
   */
  async restoreFromStorage(): Promise<WalletCreationResult | null> {
    try {
      const storedPrivateKey = await secureStorage.retrieve(STORAGE_KEY);

      if (!storedPrivateKey) {
        return null;
      }

      // Re-import without re-storing (it's already stored)
      const result = await this.importFromPrivateKey(storedPrivateKey, false);

      if (result.success) {
        logBonsaiInfo('DydxWalletService', 'restoreFromStorage', {
          address: result.dydxAddress,
        });
      }

      return result;
    } catch (error) {
      log('DydxWalletService/restoreFromStorage/error', error);
      // If restoration fails, clear corrupted data
      this.clearStoredWallet();
      return null;
    }
  }

  /**
   * Derive wallet from source wallet signature
   * This is the existing flow for connected wallets
   *
   * @param signature - Signature from source wallet
   * @param persist - Whether to persist the derived mnemonic for future sessions
   * @returns Wallet creation result with dYdX address
   */
  async deriveFromSignature(
    signature: string,
    persist: boolean = true
  ): Promise<WalletCreationResult> {
    try {
      // Derive HD key from signature
      const { mnemonic, privateKey, publicKey } =
        onboarding.deriveHDKeyFromEthereumSignature(signature);

      // Create wallet from derived mnemonic
      const LocalWallet = await getLazyLocalWallet();
      const wallet = await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX);

      if (!wallet.address || !privateKey || !publicKey) {
        return {
          success: false,
          error: 'Failed to derive wallet from signature.',
        };
      }

      // Persist derived mnemonic to secure storage
      // This replaces the old encrypted signature approach with more secure Web Crypto API
      if (persist) {
        await secureStorage.store(STORAGE_KEY, Buffer.from(privateKey).toString('hex'));
      }

      // Update app state
      await this.setWalletInState(wallet, mnemonic, privateKey, publicKey);

      logBonsaiInfo('DydxWalletService', 'deriveFromSignature', {
        address: wallet.address,
        persisted: persist,
      });

      return {
        success: true,
        dydxAddress: wallet.address as DydxAddress,
      };
    } catch (error) {
      logBonsaiError('DydxWalletService', 'Failed to deriveFromSignature', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update Redux state and managers with wallet information
   * @private
   */
  private async setWalletInState(
    wallet: LocalWallet,
    mnemonic: string,
    privateKey?: Uint8Array | null,
    publicKey?: Uint8Array | null
  ): Promise<void> {
    if (privateKey && publicKey) {
      const hdKey: PrivateInformation = {
        mnemonic,
        privateKey,
        publicKey,
      };

      // Update HD key manager
      hdKeyManager.setHdkey(wallet.address, hdKey);
    }

    // Update Redux state
    store.dispatch(
      setLocalWallet({
        address: wallet.address as DydxAddress,
        subaccountNumber: 0,
      })
    );

    // Set onboarding state to AccountConnected
    store.dispatch(setOnboardingState(OnboardingState.AccountConnected));

    // Note: Noble wallet derivation happens separately in useAccounts
    // We could potentially add that here in the future for a more complete service
  }

  /**
   * Check if a wallet is stored in secure storage
   */
  hasStoredWallet(): boolean {
    return secureStorage.has(STORAGE_KEY);
  }

  /**
   * Clear stored wallet data
   * Called on user sign out
   */
  clearStoredWallet(): void {
    secureStorage.remove(STORAGE_KEY);
    logBonsaiInfo('DydxWalletService', 'clearStoredWallet');
  }

  /**
   * Export current wallet mnemonic (for backup)
   * WARNING: Only call this when user explicitly requests backup
   *
   * @returns Decrypted mnemonic or null if not found
   */
  async exportPrivateKey(): Promise<string | null> {
    try {
      return await secureStorage.retrieve(STORAGE_KEY);
    } catch (error) {
      logBonsaiError('DydxWalletService', 'Failed to exportMnemonic', { error });
      return null;
    }
  }
}

// Export singleton instance
export const dydxWalletService = new DydxWalletService();
