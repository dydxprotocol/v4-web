import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { WalletInfo, WalletNetworkType } from '@/constants/wallets';
import { TurnkeyEmailOnboardingData, TurnkeyWallet } from '@/types/turnkey';

export type SourceAccount = {
  address?: string;
  chain?: WalletNetworkType;
  walletInfo?: WalletInfo;
};

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface WalletState {
  sourceAccount: SourceAccount;
  localWallet?: {
    address?: string;
    solanaAddress?: string;
    subaccountNumber?: number;
    // Indicates if wallet was directly imported (mnemonic) vs derived from source wallet
    // When 'imported', sourceAccount is not required for AccountConnected state
    walletSource?: 'imported' | 'derived';
  };
  turnkeyEmailOnboardingData?: TurnkeyEmailOnboardingData;
  turnkeyPrimaryWallet?: TurnkeyWallet;
}

const initialState: WalletState = {
  sourceAccount: {
    address: undefined,
    chain: undefined,
    walletInfo: undefined,
  },
  localWallet: {
    address: undefined,
    subaccountNumber: 0,
    walletSource: undefined,
  },
  turnkeyEmailOnboardingData: undefined,
  turnkeyPrimaryWallet: undefined,
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
      state.sourceAccount.address = address;
      state.sourceAccount.chain = chain;
    },
    setWalletInfo: (state, action: PayloadAction<WalletInfo>) => {
      state.sourceAccount.walletInfo = action.payload;
    },
    setLocalWallet: (
      state,
      {
        payload,
      }: PayloadAction<{
        address?: string;
        solanaAddress?: string;
        subaccountNumber?: number;
        walletSource?: 'imported' | 'derived';
      }>
    ) => {
      state.localWallet = payload;
    },
    setTurnkeyEmailOnboardingData: (state, action: PayloadAction<TurnkeyEmailOnboardingData>) => {
      state.turnkeyEmailOnboardingData = action.payload;
    },
    clearTurnkeyEmailOnboardingData: (state) => {
      state.turnkeyEmailOnboardingData = undefined;
    },
    setTurnkeyPrimaryWallet: (state, action: PayloadAction<TurnkeyWallet>) => {
      state.turnkeyPrimaryWallet = action.payload;
    },
    clearTurnkeyPrimaryWallet: (state) => {
      state.turnkeyPrimaryWallet = undefined;
    },
    clearSourceAccount: (state) => {
      state.sourceAccount = {
        address: undefined,
        chain: undefined,
        walletInfo: undefined,
      };
      state.turnkeyPrimaryWallet = undefined;
    },
  },
});

export interface WalletEphemeralState {
  localWalletNonce?: number;
  hdKeyNonce?: number;
}

const initialEphemeralState: WalletEphemeralState = {
  localWalletNonce: undefined,
  hdKeyNonce: undefined,
};

export const walletEphemeralSlice = createSlice({
  name: 'walletEphemeral',
  initialState: initialEphemeralState,
  reducers: {
    setLocalWalletNonce: (state, action: PayloadAction<number | undefined>) => {
      state.localWalletNonce = action.payload;
    },
    setHdKeyNonce: (state, action: PayloadAction<number | undefined>) => {
      state.hdKeyNonce = action.payload;
    },
  },
});

export const {
  setSourceAddress,
  setWalletInfo,
  clearSourceAccount,
  setLocalWallet,
  setTurnkeyEmailOnboardingData,
  clearTurnkeyEmailOnboardingData,
  setTurnkeyPrimaryWallet,
  clearTurnkeyPrimaryWallet,
} = walletSlice.actions;

export const { setLocalWalletNonce, setHdKeyNonce } = walletEphemeralSlice.actions;
