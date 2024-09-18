import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
  Nullable,
  VaultAccount,
  VaultDepositWithdrawSlippageResponse,
  VaultDetails,
  VaultFormValidationResult,
  VaultPositions,
} from '@/constants/abacus';

export interface VaultForm {
  amount: string;
  operation: 'DEPOSIT' | 'WITHDRAW';
  slippageAck: boolean;
  confirmationStep: boolean;
  slippageResponse: VaultDepositWithdrawSlippageResponse | undefined;
  validationResponse: VaultFormValidationResult | undefined;
}
export interface VaultsState {
  vaultDetails: VaultDetails | undefined;
  vaultPositions: VaultPositions | undefined;
  vaultAccount: VaultAccount | undefined;
  vaultForm: VaultForm;
}

const initialState: VaultsState = {
  vaultDetails: undefined,
  vaultPositions: undefined,
  vaultAccount: undefined,
  vaultForm: {
    amount: '',
    confirmationStep: false,
    slippageAck: false,
    slippageResponse: undefined,
    operation: 'DEPOSIT',
    validationResponse: undefined,
  },
};

export const vaultsSlice = createSlice({
  name: 'Vaults',
  initialState,
  reducers: {
    setVaultDetails: (state, action: PayloadAction<Nullable<VaultDetails>>) => {
      state.vaultDetails = action.payload ?? undefined;
    },
    setVaultPositions: (state, action: PayloadAction<Nullable<VaultPositions>>) => {
      state.vaultPositions = action.payload ?? undefined;
    },
    setVaultAccount: (state, action: PayloadAction<Nullable<VaultAccount>>) => {
      state.vaultAccount = action.payload ?? undefined;
    },
    setVaultFormAmount: (state, action: PayloadAction<string>) => {
      state.vaultForm.amount = action.payload;
    },
    setVaultFormSlippageAck: (state, action: PayloadAction<boolean>) => {
      state.vaultForm.slippageAck = action.payload;
    },
    setVaultFormConfirmationStep: (state, action: PayloadAction<boolean>) => {
      state.vaultForm.confirmationStep = action.payload;
    },
    setVaultFormOperation: (state, action: PayloadAction<VaultForm['operation']>) => {
      state.vaultForm.operation = action.payload;
    },
    setVaultFormSlippageResponse: (state, action: PayloadAction<VaultForm['slippageResponse']>) => {
      state.vaultForm.slippageResponse = action.payload;
    },
    setVaultFormValidationResponse: (
      state,
      action: PayloadAction<VaultForm['validationResponse']>
    ) => {
      state.vaultForm.validationResponse = action.payload;
    },
  },
});

export const {
  setVaultDetails,
  setVaultPositions,
  setVaultAccount,
  setVaultFormAmount,
  setVaultFormOperation,
  setVaultFormConfirmationStep,
  setVaultFormSlippageAck,
  setVaultFormSlippageResponse,
  setVaultFormValidationResponse,
} = vaultsSlice.actions;
