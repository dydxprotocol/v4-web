/* eslint-disable max-classes-per-file */
import { LocalWallet } from '@dydxprotocol/v4-client-js';

import { Hdkey } from '@/constants/account';

import type { RootStore } from '@/state/_store';
import { setHdKeyNonce, setLocalWalletNonce } from '@/state/wallet';

import {
  deriveCosmosWallet,
  deriveCosmosWalletFromPrivateKey,
} from './onboarding/deriveCosmosWallets';
import { log } from './telemetry';

class HDKeyManager {
  private address: string | undefined;

  private hdkey: Hdkey | undefined;

  private hdKeyNonce: number | undefined;

  private store: RootStore | undefined;

  setStore(store: RootStore) {
    this.store = store;
  }

  setHdkey(address: string | undefined, hdkey: Hdkey) {
    this.hdKeyNonce = this.hdKeyNonce != null ? this.hdKeyNonce + 1 : 0;
    this.address = address;
    this.hdkey = hdkey;

    if (!this.store) {
      log('HDKeyManager: store has not been set');
      return;
    }
    this.store.dispatch(setHdKeyNonce(this.hdKeyNonce));
  }

  getHdkey(localWalletAddress: string, hdKeyNonce: number): Hdkey | undefined {
    if (localWalletAddress !== this.address || hdKeyNonce !== this.hdKeyNonce) {
      return undefined;
    }
    return this.hdkey;
  }

  clearHdkey() {
    this.hdkey = undefined;
    this.address = undefined;
    this.hdKeyNonce = undefined;
    this.store?.dispatch(setHdKeyNonce(undefined));
  }
}

export const hdKeyManager = new HDKeyManager();

class LocalWalletManager {
  private localWalletNonce: number | undefined;

  private store: RootStore | undefined;

  private localWallet: LocalWallet | undefined;

  private hdKey: Hdkey | undefined;

  // Cache for derived Noble wallet
  private localNobleWalletCache: LocalWallet | undefined;

  setStore(store: RootStore) {
    this.store = store;
  }

  setLocalWallet(localWallet: LocalWallet, hdKey: Hdkey) {
    this.localWalletNonce = this.localWalletNonce != null ? this.localWalletNonce + 1 : 0;
    this.localWallet = localWallet;
    this.hdKey = hdKey;

    // Clear Noble wallet cache when wallet changes
    this.localNobleWalletCache = undefined;

    if (!this.store) {
      log('LocalWalletManager: store has not been set');
      return;
    }

    this.store.dispatch(setLocalWalletNonce(this.localWalletNonce));
  }

  getLocalWallet(localWalletNonce: number): LocalWallet | undefined {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    return this.localWallet;
  }

  /**
   * Get Noble wallet - derives on-demand from hdKey
   * Returns cached version if already derived for this nonce
   */
  async getLocalNobleWallet(localWalletNonce: number): Promise<LocalWallet | undefined> {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    // Return cached if available
    if (this.localNobleWalletCache) {
      return this.localNobleWalletCache;
    }

    // Derive from hdKey if available
    if (this.hdKey?.mnemonic) {
      try {
        this.localNobleWalletCache =
          (await deriveCosmosWallet(this.hdKey.mnemonic, 'noble')) ?? undefined;

        return this.localNobleWalletCache;
      } catch (error) {
        log('LocalWalletManager: Failed to derive Noble wallet', error);
        return undefined;
      }
    } else if (this.hdKey?.privateKey) {
      try {
        const privateKey = Buffer.from(this.hdKey.privateKey).toString('hex');
        this.localNobleWalletCache =
          (await deriveCosmosWalletFromPrivateKey(privateKey, 'noble')) ?? undefined;

        return this.localNobleWalletCache;
      } catch (error) {
        log('LocalWalletManager: Failed to derive Noble wallet', error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Get cached Noble wallet synchronously (for selectors)
   * Returns cached version if available, otherwise undefined
   * Does NOT trigger derivation - use getLocalNobleWallet() for that
   */
  getCachedLocalNobleWallet(localWalletNonce: number): LocalWallet | undefined {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    return this.localNobleWalletCache;
  }

  clearLocalWallet() {
    this.localWalletNonce = undefined;
    this.localWallet = undefined;
    this.hdKey = undefined;
    this.localNobleWalletCache = undefined;
    this.store?.dispatch(setLocalWalletNonce(undefined));
  }
}

export const localWalletManager = new LocalWalletManager();
