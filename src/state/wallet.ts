import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { WalletInfo, WalletNetworkType } from '@/constants/wallets';

export interface WalletState {
  sourceAccount: {
    address?: string;
    chain?: WalletNetworkType;
    encryptedSignature?: string;
    walletInfo?: WalletInfo;
  };
}

const initialState: WalletState = {
  sourceAccount: {
    address: undefined,
    chain: undefined,
    encryptedSignature: undefined,
    walletInfo: undefined,
  },
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setSourceAddress: (
      state,
      action: PayloadAction<{ address: string; chain: WalletNetworkType }>
    ) => {
      const { address, chain } = action.payload;
      if (!state.sourceAccount) {
        throw new Error('cannot set source address if source account is not defined');
      }

      // if the source wallet address has changed, clear the derived signature
      if (state.sourceAccount.address !== address) {
        state.sourceAccount.encryptedSignature = undefined;
      }

      state.sourceAccount.address = address;
      state.sourceAccount.chain = chain;
    },
    setWalletInfo: (state, action: PayloadAction<WalletInfo>) => {
      state.sourceAccount.walletInfo = action.payload;
    },
    setSavedEncryptedSignature: (state, action: PayloadAction<string>) => {
      if (state.sourceAccount.chain === WalletNetworkType.Cosmos) {
        throw new Error('cosmos wallets should not require signatures for derived addresses');
      }

      state.sourceAccount.encryptedSignature = action.payload;
    },
    clearSavedEncryptedSignature: (state) => {
      state.sourceAccount.encryptedSignature = undefined;
    },
    clearSourceAccount: (state) => {
      state.sourceAccount = {
        address: undefined,
        chain: undefined,
        encryptedSignature: undefined,
        walletInfo: undefined,
      };
    },
  },
});

export const {
  setSourceAddress,
  setWalletInfo,
  setSavedEncryptedSignature,
  clearSavedEncryptedSignature,
  clearSourceAccount,
} = walletSlice.actions;
