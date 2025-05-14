import { convertVanillaReducerActionsToReduxToolkitReducers } from '@/bonsai/lib/forms';
import { BonsaiForms } from '@/bonsai/ontology';
import { createSlice } from '@reduxjs/toolkit';

const closePositionFormReducer = BonsaiForms.TradeFormFns.reducer;

export const closePositionFormSlice = createSlice({
  name: 'closePositionForm',
  initialState: closePositionFormReducer.initialState,
  reducers: convertVanillaReducerActionsToReduxToolkitReducers(closePositionFormReducer),
});

export const closePositionFormActions = {
  setMarketId: closePositionFormSlice.actions.setMarketId,
  reset: closePositionFormSlice.actions.reset,
  setSizeAvailablePercent: closePositionFormSlice.actions.setSizeAvailablePercent,
  setSizeToken: closePositionFormSlice.actions.setSizeToken,
  setSizeUsd: closePositionFormSlice.actions.setSizeUsd,
  setLimitPrice: closePositionFormSlice.actions.setLimitPrice,
  setOrderType: closePositionFormSlice.actions.setOrderType,
  setSizeLeverageSigned: closePositionFormSlice.actions.setSizeLeverageSigned,
};
