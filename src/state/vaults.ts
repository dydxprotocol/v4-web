import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { range } from 'lodash';

import { timeUnits } from '@/constants/time';

export interface VaultsState {
  vaultDetails: VaultDetails;
  vaultHistory: VaultHistory | undefined;
  userVault: VaultOwnership | undefined;
}
type VaultDetails = {
  totalValue: number;
  thirtyDayReturnPercent: number;
  positions: Array<VaultPosition>;
};
type VaultPosition = {
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
};
type VaultOwnership = {
  userBalance: number;
  userReturn: {
    absolute: number;
    percent: number;
  };
  transactionHistory: VaultTransaction[];
};
export type VaultTransaction = {
  timestampMs: number;
  amountUsdc: number;
  type: 'withdrawal' | 'deposit';
  id: string;
};
type VaultHistory = {
  pnlAndEquityDataPoints: Array<{ date: number; equity: number; totalPnl: number }>;
};

const initialState: VaultsState = {
  vaultDetails: {
    totalValue: 930_425_857,
    thirtyDayReturnPercent: 0.1474,
    positions: [
      ...range(1).map((a) => ({
        asset: { id: 'PEPE', name: 'Pepe' },
        marketId: `PEPE-USD${a}`,
        marginUsdc: 10_000,
        currentLeverageMultiple: 1.2,
        currentPosition: { asset: 1734112, usdc: 423.67 },
        thirtyDayPnl: {
          percent: 0.123,
          absolute: 1123,
          sparklinePoints: [1, 2, 3, 2, 1, 4, 3, 1, 3, 1, 2],
        },
      })),
    ],
  },
  vaultHistory: {
    pnlAndEquityDataPoints: [
      ...range(50).map((i) => ({
        date: new Date('6/1/2024').valueOf() + timeUnits.day * i,
        equity: 1000 + Math.random() * 1000,
        totalPnl: 100 + Math.random() * 5000,
      })),
    ],
  },
  userVault: {
    userBalance: 10430,
    userReturn: { absolute: 1923.61, percent: 0.1243 },
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
