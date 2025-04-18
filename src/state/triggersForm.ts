import { TriggerOrdersFormFns } from '@/bonsai/forms/triggers/triggers';
import { convertVanillaReducerActionsToReduxToolkitReducers } from '@/bonsai/lib/forms';
import { createSlice } from '@reduxjs/toolkit';

const triggerFormReducer = TriggerOrdersFormFns.reducer;

export const triggersFormSlice = createSlice({
  name: 'TriggersForm',
  initialState: triggerFormReducer.initialState,
  reducers: convertVanillaReducerActionsToReduxToolkitReducers(triggerFormReducer),
});

export const triggersFormActions = triggersFormSlice.actions;
