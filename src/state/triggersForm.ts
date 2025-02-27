import { TriggerOrdersFormFns } from '@/bonsai/forms/triggers/triggers';
import { convertVanillaReducerActionsToReduxToolkitReducers } from '@/bonsai/lib/forms';
import { createSlice } from '@reduxjs/toolkit';

const newTriggerFormReducer = TriggerOrdersFormFns.reducer;

export const triggersFormSlice = createSlice({
  name: 'TriggersForm',
  initialState: newTriggerFormReducer.initialState,
  reducers: convertVanillaReducerActionsToReduxToolkitReducers(newTriggerFormReducer),
});

export const triggersFormActions = triggersFormSlice.actions;
