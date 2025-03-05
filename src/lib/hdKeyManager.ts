/* eslint-disable max-classes-per-file */
import { LocalWallet } from '@dydxprotocol/v4-client-js';

import { Hdkey } from '@/constants/account';

import type { RootStore } from '@/state/_store';
import { setLocalWalletNonce } from '@/state/wallet';

import { log } from './telemetry';

class HDKeyManager {
  private address: string | undefined;

  private hdkey: Hdkey | undefined;

  setHdkey(address: string | undefined, hdkey: Hdkey) {
    this.address = address;
    this.hdkey = hdkey;
  }

  getHdkey(localWalletAddress: string): Hdkey | undefined {
    if (localWalletAddress !== this.address) {
      return undefined;
    }

    return this.hdkey;
  }

  clearHdkey() {
    this.hdkey = undefined;
    this.address = undefined;
  }
}

export const hdKeyManager = new HDKeyManager();

class LocalWalletManager {
  private localWalletNonce: number | undefined;

  private store: RootStore | undefined;

  private localWallet: LocalWallet | undefined;

  private localNobleWallet: LocalWallet | undefined;

  setStore(store: RootStore) {
    this.store = store;
  }

  setLocalWallet(localWallet: LocalWallet, localNobleWallet: LocalWallet) {
    this.localWalletNonce = this.localWalletNonce != null ? this.localWalletNonce + 1 : 0;
    this.localWallet = localWallet;
    this.localNobleWallet = localNobleWallet;

    if (!this.store) {
      log('LocalWalletManager: store has not been set');
    }

    this.store?.dispatch(setLocalWalletNonce(this.localWalletNonce));
  }

  getLocalWallet(localWalletNonce: number): LocalWallet | undefined {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    return this.localWallet;
  }

  getLocalNobleWallet(localWalletNonce: number): LocalWallet | undefined {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    return this.localNobleWallet;
  }

  clearLocalWallet() {
    this.localWalletNonce = undefined;
    this.localWallet = undefined;
    this.localNobleWallet = undefined;
  }
}

export const localWalletManager = new LocalWalletManager();
