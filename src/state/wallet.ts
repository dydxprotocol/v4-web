import { logBonsaiError } from '@/bonsai/logs';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { ConnectorType, WalletInfo, WalletNetworkType } from '@/constants/wallets';
import { TurnkeyEmailOnboardingData, TurnkeyWallet } from '@/types/turnkey';

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
  turnkeyEmailOnboardingData?: TurnkeyEmailOnboardingData;
  turnkeyPrimaryWallet?: TurnkeyWallet;
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
  turnkeyEmailOnboardingData: undefined,
  turnkeyPrimaryWallet: undefined,
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
    setRequiresAddressUpload: (state, action: PayloadAction<boolean>) => {
      if (state.sourceAccount.walletInfo?.connectorType === ConnectorType.Turnkey) {
        state.sourceAccount.walletInfo.requiresAddressUpload = action.payload;
      } else {
        logBonsaiError(
          'WalletState',
          'Attempting to set a Turnkey specific property on a non-turnkey wallet',
          {
            walletInfo: state.sourceAccount.walletInfo,
          }
        );
      }
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
        encryptedSignature: undefined,
        walletInfo: undefined,
      };
      state.turnkeyPrimaryWallet = undefined;
    },
  },
});

export const {
  setLocalWalletNonce,
  setSourceAddress,
  setRequiresAddressUpload,
  setWalletInfo,
  setSavedEncryptedSignature,
  clearSavedEncryptedSignature,
  clearSourceAccount,
  setLocalWallet,
  setTurnkeyEmailOnboardingData,
  clearTurnkeyEmailOnboardingData,
  setTurnkeyPrimaryWallet,
  clearTurnkeyPrimaryWallet,
} = walletSlice.actions;
