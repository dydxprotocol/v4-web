import type { Key } from '@keplr-wallet/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CosmosAccountState {
  account?: Record<string, Key>;
}

const initialState: CosmosAccountState = {
  account: undefined,
};

export const cosmosAccountSlice = createSlice({
  name: 'CosmosAccount',
  initialState,
  reducers: {
    setCosmosAccount: (
      state: CosmosAccountState,
      action: PayloadAction<Record<string, Key> | undefined>
    ) => ({
      ...state,
      account: action.payload,
    }),
  },
});

export const { setCosmosAccount } = cosmosAccountSlice.actions;
