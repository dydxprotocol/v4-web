import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { SpotApiSide } from '@/clients/spotApi';

export type SpotTrade = {
  id: string;
  side: SpotApiSide;
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
