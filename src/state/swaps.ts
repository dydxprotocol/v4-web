import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Route } from '@skip-go/client';

export type Swap = {
  id: string;
  route: Route;
  status: 'pending' | 'pending-transfer' | 'success' | 'error';
  txHash?: string;
  updatedAt?: number;
};

type SwapState = {
  swaps: Swap[];
};

const initialState: SwapState = {
  swaps: [],
};

export const swapsSlice = createSlice({
  name: 'Swaps',
  initialState,
  reducers: {
    addSwap: (state, action: PayloadAction<{ swap: Swap }>) => {
      const { swap } = action.payload;
      const newSwap = { ...swap, updatedAt: Date.now() };
      state.swaps.push(newSwap);
    },
    updateSwap: (state, action: PayloadAction<{ swap: Partial<Swap> & { id: string } }>) => {
      const { swap } = action.payload;
      state.swaps = state.swaps.map((s) =>
        s.id === swap.id ? { ...s, ...swap, updatedAt: Date.now() } : s
      );
    },
  },
});

export const { addSwap, updateSwap } = swapsSlice.actions;
