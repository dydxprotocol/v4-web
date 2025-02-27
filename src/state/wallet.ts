import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { WalletInfo, WalletNetworkType } from '@/constants/wallets';

export type SourceAccount = {
  address?: string;
  chain?: WalletNetworkType;
  encryptedSignature?: string;
  walletInfo?: WalletInfo;
};

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface WalletState {
  sourceAccount: SourceAccount;
  localWallet?: {
    address?: string;
    subaccountNumber?: number;
  };
  localWalletNonce?: number;
}

const initialState: WalletState = {
  sourceAccount: {
    address: undefined,
    chain: undefined,
    encryptedSignature: undefined,
    walletInfo: undefined,
  },
  localWallet: {
    address: undefined,
    subaccountNumber: 0,
  },
  localWalletNonce: undefined,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setLocalWalletNonce: (state, action: PayloadAction<number | undefined>) => {
      state.localWalletNonce = action.payload;
    },
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
    setLocalWallet: (
      state,
      { payload }: PayloadAction<{ address?: string; subaccountNumber?: number }>
    ) => {
      state.localWallet = payload;
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
  setLocalWalletNonce,
  setSourceAddress,
  setWalletInfo,
  setSavedEncryptedSignature,
  clearSavedEncryptedSignature,
  clearSourceAccount,
  setLocalWallet,
} = walletSlice.actions;
