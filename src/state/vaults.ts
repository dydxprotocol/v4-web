import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface VaultsState {
  vaultDetails: VaultDetails;
  vaultHistory: VaultHistory;
  userVault: VaultOwnership | undefined;
}
type VaultDetails = {
  totalValue: number;
  allTimePnl: {
    percent: number;
    absolute: number;
  };
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
    totalValue: 30_425,
    allTimePnl: { absolute: 4_125, percent: 0.1252 },
    thirtyDayReturnPercent: 0.1474,
    positions: [
      {
        asset: { id: 'PEPE', name: 'Pepe' },
        marketId: 'PEPE-USD',
        marginUsdc: 10_000,
        currentLeverageMultiple: 1.2,
        currentPosition: { asset: 1734112, usdc: 423.67 },
        thirtyDayPnl: {
          percent: 0.123,
          absolute: 1123,
          sparklinePoints: [1, 2, 3, 2, 1, 4, 3, 1, 3, 1, 2],
        },
      },
    ],
  },
  vaultHistory: {
    pnlAndEquityDataPoints: [
      {
        date: new Date('6/1/2024').valueOf(),
        equity: 1000,
        totalPnl: 100,
      },
      {
        date: new Date('6/2/2024').valueOf(),
        equity: 1500,
        totalPnl: 600,
      },
      {
        date: new Date('6/3/2024').valueOf(),
        equity: 1700,
        totalPnl: 800,
      },
      {
        date: new Date('6/4/2024').valueOf(),
        equity: 1600,
        totalPnl: 800,
      },
      {
        date: new Date('6/5/2024').valueOf(),
        equity: 2000,
        totalPnl: 1000,
      },
      {
        date: new Date('6/6/2024').valueOf(),
        equity: 2300,
        totalPnl: 1300,
      },
      {
        date: new Date('6/7/2024').valueOf(),
        equity: 2800,
        totalPnl: 2000,
      },
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
