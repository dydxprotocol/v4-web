import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SpotTrade = {
  id: string;
  side: 'buy' | 'sell';
  tokenSymbol: string;
  tokenAmount: string;
  solAmount: string;
  txHash: string;
  status: 'success' | 'error';
  createdAt: number;
};

type SpotTradesState = {
  trades: SpotTrade[];
};

const initialState: SpotTradesState = {
  trades: [],
};

export const spotTradesSlice = createSlice({
  name: 'SpotTrades',
  initialState,
  reducers: {
    addSpotTrade: (state, action: PayloadAction<{ trade: SpotTrade }>) => {
      const { trade } = action.payload;
      state.trades.push(trade);
    },
  },
});

export const { addSpotTrade } = spotTradesSlice.actions;
