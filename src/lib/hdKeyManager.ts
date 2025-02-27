import { LocalWallet } from '@dydxprotocol/v4-client-js';

import { Hdkey } from '@/constants/account';

class HDKeyManager {
  private address: string | undefined;

  private hdkey: Hdkey | undefined;

  private localDydxWallet: LocalWallet | undefined;

  setHdkey(address: string | undefined, hdkey: Hdkey, localDydxWallet: LocalWallet) {
    this.address = address;
    this.hdkey = hdkey;
    this.localDydxWallet = localDydxWallet;
  }

  getHdkey(localWalletAddress: string): Hdkey | undefined {
    if (localWalletAddress !== this.address) {
      return undefined;
    }

    return this.hdkey;
  }

  getLocalDydxWallet(): LocalWallet | undefined {
    if (this.hdkey?.privateKey && this.hdkey.publicKey) {
      return this.localDydxWallet;
    }

    return undefined;
  }

  clearHdkey() {
    this.hdkey = undefined;
    this.address = undefined;
    this.localDydxWallet = undefined;
  }
}

export const hdKeyManager = new HDKeyManager();
