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

type VaultOwnership = {
  userBalance: number;
  userReturn: number;
};

export interface VaultsState {
  vaults: Record<string, VaultMetadata>;
  vaultDetails: Record<string, VaultDetails | undefined>;
  userVaults: Record<string, VaultOwnership | undefined>;
}

const initialState: VaultsState = {
  vaults: { 'PEPE-USD': { totalValue: 30_425 } },
  vaultDetails: {
    'PEPE-USD': {
      allTimePnl: { absolute: 4_125, percent: 0.1252 },
      currentLeverageMultiple: 1.2,
      currentPosition: { asset: 17341235412, usdc: 423.67 },
      thirtyDayReturnPercent: 0.1474,
    },
  },
  userVaults: {
    'PEPE-USD': { userBalance: 10, userReturn: 3 },
  },
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
