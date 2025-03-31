import { TradeFormFns } from '@/bonsai/forms/trade/trade';
import { convertVanillaReducerActionsToReduxToolkitReducers } from '@/bonsai/lib/forms';
import { createSlice } from '@reduxjs/toolkit';

const tradeFormReducer = TradeFormFns.reducer;

export const tradeFormSlice = createSlice({
  name: 'TradeForm',
  initialState: tradeFormReducer.initialState,
  reducers: convertVanillaReducerActionsToReduxToolkitReducers(tradeFormReducer),
});

export const tradeFormActions = tradeFormSlice.actions;
