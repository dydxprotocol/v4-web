import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import {
  CosmosWalletInfo,
  DydxAddress,
  EvmAddress,
  PhantomSolanaWalletInfo,
  SolAddress,
  WalletInfo,
} from '@/constants/wallets';

type EvmAccount = {
  address: EvmAddress;
  chain: 'evm';
  encryptedSignature?: string;
  walletInfo: WalletInfo;
};
type SolanaAccount = {
  address: SolAddress;
  chain: 'solana';
  encryptedSignature?: string;
  walletInfo: PhantomSolanaWalletInfo;
};
type CosmosAccount = { address: DydxAddress; chain: 'cosmos'; walletInfo: CosmosWalletInfo };

type SourceAccount = EvmAccount | SolanaAccount | CosmosAccount;

export interface WalletState {
  sourceAccount: SourceAccount | undefined;
}

const initialState: WalletState = {
  sourceAccount: undefined,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setSourceAccount: (state, action: PayloadAction<SourceAccount>) => {
      state.sourceAccount = action.payload;
    },
    setSavedEncryptedSignature: (state, action: PayloadAction<string>) => {
      if (!state.sourceAccount) {
        throw new Error('no source account set');
      }

      if (state.sourceAccount.chain === 'cosmos') {
        throw new Error('cosmos wallets should not require signatures for derived addresses');
      }

      state.sourceAccount.encryptedSignature = action.payload;
    },
    clearSavedEncryptedSignature: (state) => {
      if (!state.sourceAccount || state.sourceAccount.chain === 'cosmos') return;

      state.sourceAccount.encryptedSignature = undefined;
    },
    clearSourceAccount: (state) => {
      state.sourceAccount = undefined;
    },
  },
});

export const { setSourceAccount, setSavedEncryptedSignature, clearSourceAccount } =
  walletSlice.actions;
