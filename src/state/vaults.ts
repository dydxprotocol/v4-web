import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type VaultMetadata = { totalValue: number };

type VaultDetails = {
  allTimePnl: {
    percent: number;
    absolute: number;
  };
  thirtyDayReturnPercent: number;
  currentLeverageMultiple: number;
  currentPosition: {
    asset: number;
    usdc: number;
  };
};

type VaultOwnership = {};

export interface VaultsState {
  vaults: Record<string, VaultMetadata>;
  vaultDetails: Record<string, VaultDetails>;
  userVaults: Record<string, VaultOwnership>;
}

const initialState: VaultsState = {
  vaults: { 'PEPE-USD': { totalValue: 30_425 } },
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
