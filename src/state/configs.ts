import type { kollections } from '@dydxprotocol/v4-abacus';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  Configs,
  EquityTiers,
  FeeDiscount,
  FeeTier,
  NetworkConfigs,
  Nullable,
} from '@/constants/abacus';

export interface ConfigsState {
  feeTiers?: kollections.List<FeeTier>;
  equityTiers?: EquityTiers;
  feeDiscounts?: FeeDiscount[];
  network?: NetworkConfigs;
}

const initialState: ConfigsState = {
  feeDiscounts: undefined,
  feeTiers: undefined,
  equityTiers: undefined,
  network: undefined,
};

export const configsSlice = createSlice({
  name: 'Configs',
  initialState,
  reducers: {
    setConfigs: (state: ConfigsState, action: PayloadAction<Nullable<Configs>>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const { setConfigs } = configsSlice.actions;
