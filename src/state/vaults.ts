import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type VaultDetails = {
  totalValue: number;
  allTimePnl: {
    percent: number;
    absolute: number;
  };
  thirtyDayReturnPercent: number;
  positions: Array<{
    asset: { id: string; name: string };
    marketId: string;
    marginUsdc: number;
    currentLeverageMultiple: number;
    currentPosition: {
      asset: number;
      usdc: number;
    };
    thirtyDayPnl: {
      percent: number;
      absolute: number;
      sparklinePoints: number[];
    };
  }>;
};
export type VaultTransaction = {
  timestampMs: number;
  amountUsdc: number;
  type: 'withdrawal' | 'deposit';
  id: string;
};
type VaultOwnership = {
  userBalance: number;
  userReturn: number;
  transactionHistory: VaultTransaction[];
};

export interface VaultsState {
  vaultDetails: VaultDetails;
  userVault: VaultOwnership | undefined;
}

const initialState: VaultsState = {
  vaultDetails: {
    totalValue: 30_425,
    allTimePnl: { absolute: 4_125, percent: 0.1252 },
    thirtyDayReturnPercent: 0.1474,
    positions: [
      {
        asset: { id: 'PEPE', name: 'Pepe' },
        marketId: 'PEPE-USD',
        marginUsdc: 10_000,
        currentLeverageMultiple: 1.2,
        currentPosition: { asset: 17341235412, usdc: 423.67 },
        thirtyDayPnl: {
          percent: 0.123,
          absolute: 1123,
          sparklinePoints: [1, 2, 3, 2, 1, 4, 3, 1, 3, 1, 2],
        },
      },
    ],
  },
  userVault: {
    userBalance: 10,
    userReturn: 3,
    transactionHistory: [
      {
        timestampMs: new Date('8/1/24 1:23 PM').valueOf(),
        amountUsdc: 100,
        type: 'deposit',
        id: '1',
      },
      {
        timestampMs: new Date('8/8/24 5:27 AM').valueOf(),
        amountUsdc: 150,
        type: 'withdrawal',
        id: '2',
      },
    ],
  },
};

export const vaultsSlice = createSlice({
  name: 'Vaults',
  initialState,
  reducers: {
    setVault: (state: VaultsState, action: PayloadAction<VaultDetails>) => {
      state.vaultDetails = action.payload;
    },
  },
});

export const { setVault } = vaultsSlice.actions;
