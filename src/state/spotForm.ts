import { convertVanillaReducerActionsToReduxToolkitReducers } from '@/bonsai/lib/forms';
import { BonsaiForms } from '@/bonsai/ontology';
import { createSlice } from '@reduxjs/toolkit';

const spotFormReducer = BonsaiForms.SpotFormFns.reducer;

export const spotFormSlice = createSlice({
  name: 'spotForm',
  initialState: spotFormReducer.initialState,
  reducers: convertVanillaReducerActionsToReduxToolkitReducers(spotFormReducer),
});

export const spotFormActions = spotFormSlice.actions;
