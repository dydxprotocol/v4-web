import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface VaultForm {
  amount: string;
  operation: 'DEPOSIT' | 'WITHDRAW';
  slippageAck: boolean;
  termsAck: boolean;
  confirmationStep: boolean;
}
export interface VaultsState {
  vaultForm: VaultForm;
}

const initialState: VaultsState = {
  vaultForm: {
    amount: '',
    confirmationStep: false,
    slippageAck: false,
    termsAck: false,
    operation: 'DEPOSIT',
  },
};

export const vaultsSlice = createSlice({
  name: 'Vaults',
  initialState,
  reducers: {
    setVaultFormAmount: (state, action: PayloadAction<string>) => {
      state.vaultForm.amount = action.payload;
    },
    setVaultFormSlippageAck: (state, action: PayloadAction<boolean>) => {
      state.vaultForm.slippageAck = action.payload;
    },
    setVaultFormTermsAck: (state, action: PayloadAction<boolean>) => {
      state.vaultForm.termsAck = action.payload;
    },
    setVaultFormConfirmationStep: (state, action: PayloadAction<boolean>) => {
      state.vaultForm.confirmationStep = action.payload;
    },
    setVaultFormOperation: (state, action: PayloadAction<VaultForm['operation']>) => {
      state.vaultForm.operation = action.payload;
    },
    resetVaultForm: (state) => {
      state.vaultForm = {
        amount: '',
        confirmationStep: false,
        slippageAck: false,
        termsAck: false,
        operation: 'DEPOSIT',
      };
    },
  },
});

export const {
  setVaultFormAmount,
  setVaultFormOperation,
  setVaultFormConfirmationStep,
  setVaultFormSlippageAck,
  setVaultFormTermsAck,
  resetVaultForm,
} = vaultsSlice.actions;
