import { logBonsaiError } from '@/bonsai/logs';

import { DydxAddress } from '@/constants/wallets';

import { secureStorage } from './secureStorage';

const STORAGE_KEY = 'trading_wallet_key';

export interface WalletCreationResult {
  success: boolean;
  dydxAddress?: DydxAddress;
  error?: string;
}

export class DydxPersistedWalletService {
  hasStoredWallet(): boolean {
    return secureStorage.has(STORAGE_KEY);
  }

  /**
   * Called on user sign out
   */
  clearStoredWallet(): void {
    secureStorage.remove(STORAGE_KEY);
  }

  /**
   * @param mnemonic - Mnemonic to store
   */
  async secureStorePhrase(mnemonic?: string | null): Promise<void> {
    try {
      if (!mnemonic) {
        this.clearStoredWallet();
        throw new Error('PrivateKey was not derived from Signature');
      }

      await secureStorage.store(STORAGE_KEY, mnemonic);
    } catch (error) {
      logBonsaiError('DydxWalletService', `Failed to secure store ${STORAGE_KEY}`, { error });
    }
  }

  /**
   * @returns Decrypted trading key or null if not found
   */
  async exportPhrase(): Promise<string | null> {
    try {
      return await secureStorage.retrieve(STORAGE_KEY);
    } catch (error) {
      logBonsaiError('DydxWalletService', `Failed to export ${STORAGE_KEY}`, { error });
      return null;
    }
  }
}

export const dydxPersistedWalletService = new DydxPersistedWalletService();
