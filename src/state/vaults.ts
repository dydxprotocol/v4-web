import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type VaultMetadata = {};

type VaultDetails = {};

type VaultOwnership = {};

export interface VaultsState {
  vaults: Record<string, VaultMetadata>;
  vaultDetails: Record<string, VaultDetails>;
  userVaults: Record<string, VaultOwnership>;
}

const initialState: VaultsState = {
  vaults: {},
  vaultDetails: {},
  userVaults: {},
};

export const vaultsSlice = createSlice({
  name: 'Vaults',
  initialState,
  reducers: {
    setVaults: (state: VaultsState, action: PayloadAction<Record<string, VaultMetadata>>) => {
      state.vaults = action.payload;
    },
  },
});

export const { setVaults } = vaultsSlice.actions;
