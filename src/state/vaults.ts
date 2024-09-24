import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface VaultForm {
  amount: string;
  operation: 'DEPOSIT' | 'WITHDRAW';
  slippageAck: boolean;
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
    setVaultFormConfirmationStep: (state, action: PayloadAction<boolean>) => {
      state.vaultForm.confirmationStep = action.payload;
    },
    setVaultFormOperation: (state, action: PayloadAction<VaultForm['operation']>) => {
      state.vaultForm.operation = action.payload;
    },
  },
});

export const {
  setVaultFormAmount,
  setVaultFormOperation,
  setVaultFormConfirmationStep,
  setVaultFormSlippageAck,
} = vaultsSlice.actions;
