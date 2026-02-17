/* eslint-disable max-classes-per-file */
import { LocalWallet } from '@dydxprotocol/v4-client-js';
import { Keypair } from '@solana/web3.js';

import { Hdkey } from '@/constants/account';

import type { RootStore } from '@/state/_store';
import { setHdKeyNonce, setLocalWalletNonce } from '@/state/wallet';

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

  private localNobleWallet: LocalWallet | undefined;

  private localSolanaKeypair: Keypair | undefined;

  setStore(store: RootStore) {
    this.store = store;
  }

  setLocalWallet(
    localWallet: LocalWallet,
    localNobleWallet: LocalWallet,
    localSolanaKeypair: Keypair
  ) {
    this.localWalletNonce = this.localWalletNonce != null ? this.localWalletNonce + 1 : 0;
    this.localWallet = localWallet;
    this.localNobleWallet = localNobleWallet;
    this.localSolanaKeypair = localSolanaKeypair;

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

  getLocalNobleWallet(localWalletNonce: number): LocalWallet | undefined {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    return this.localNobleWallet;
  }

  getLocalSolanaKeypair(localWalletNonce: number): Keypair | undefined {
    if (localWalletNonce !== this.localWalletNonce) {
      return undefined;
    }

    return this.localSolanaKeypair;
  }

  clearLocalWallet() {
    this.localWalletNonce = undefined;
    this.localWallet = undefined;
    this.localNobleWallet = undefined;
    this.localSolanaKeypair = undefined;
    this.store?.dispatch(setLocalWalletNonce(undefined));
  }
}

export const localWalletManager = new LocalWalletManager();
