import { convertVanillaReducerActionsToReduxToolkitReducers } from '@/bonsai/lib/forms';
import { BonsaiForms } from '@/bonsai/ontology';
import { createSlice } from '@reduxjs/toolkit';

const tradeFormReducer = BonsaiForms.TradeFormFns.reducer;

export const tradeFormSlice = createSlice({
  name: 'TradeForm',
  initialState: tradeFormReducer.initialState,
  reducers: convertVanillaReducerActionsToReduxToolkitReducers(tradeFormReducer),
});

export const tradeFormActions = tradeFormSlice.actions;
