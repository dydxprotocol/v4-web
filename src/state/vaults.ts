import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Nullable, VaultAccount, VaultDetails, VaultPositions } from '@/constants/abacus';

export interface VaultsState {
  vaultDetails: VaultDetails | undefined;
  vaultPositions: VaultPositions | undefined;
  vaultAccount: VaultAccount | undefined;
}

const initialState: VaultsState = {
  vaultDetails: undefined,
  vaultPositions: undefined,
  vaultAccount: undefined,
};

export const vaultsSlice = createSlice({
  name: 'Vaults',
  initialState,
  reducers: {
    setVaultDetails: (state: VaultsState, action: PayloadAction<Nullable<VaultDetails>>) => {
      state.vaultDetails = action.payload ?? undefined;
    },
    setVaultPositions: (state: VaultsState, action: PayloadAction<Nullable<VaultPositions>>) => {
      state.vaultPositions = action.payload ?? undefined;
    },
    setVaultAccount: (state: VaultsState, action: PayloadAction<Nullable<VaultAccount>>) => {
      state.vaultAccount = action.payload ?? undefined;
    },
  },
});

export const { setVaultDetails, setVaultPositions, setVaultAccount } = vaultsSlice.actions;
