import { useMemo, useState } from 'react';

import { mapValues } from 'lodash';

import { ValidationError } from './validationErrors';

export type BasicForm<State, Reducer extends VanillaReducer<State, any>, SummaryArgs, Summary> = {
  reducer: Reducer;
  calculateSummary: (state: State, args: SummaryArgs) => Summary;
  getErrors: (state: State, inputs: SummaryArgs, summary: NoInfer<Summary>) => ValidationError[];
};

// no-op for typing reasons
export function createForm<
  State,
  Reducer extends VanillaReducer<State, any>,
  SummaryArgs,
  Summary,
>(config: {
  reducer: Reducer;
  calculateSummary: (state: State, args: SummaryArgs) => Summary;
  getErrors: (state: State, inputs: SummaryArgs, summary: NoInfer<Summary>) => ValidationError[];
}): BasicForm<State, Reducer, SummaryArgs, Summary> {
  return config;
}

export type VanillaReducer<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
> = {
  initialState: State;
  actions: Actions;
};

// no-op for typing reasons
export function createVanillaReducer<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
>(config: VanillaReducer<State, Actions>): VanillaReducer<State, Actions> {
  return config;
}

export function useVanillaReducer<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
>(reducer: VanillaReducer<State, Actions>) {
  const [state, setState] = useState(reducer.initialState);
  const actions = useMemo(
    () =>
      mapValues(reducer.actions, (modifierFn) => (arg: any) => {
        setState((oldState) => modifierFn(oldState, arg));
      }) as { [P in keyof Actions]: (...args: Tail<Parameters<Actions[P]>>) => void },
    [reducer.actions]
  );
  return { state, actions };
}

// this is a non-standard tail since we return empty array when given arrays of length 0 or 1
type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : [];

export function useFormValues<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
  SummaryArgs,
  Summary,
>(
  form: BasicForm<State, VanillaReducer<State, Actions>, SummaryArgs, Summary>,
  inputs: SummaryArgs
) {
  const { state, actions } = useVanillaReducer(form.reducer);
  const summary = useMemo(() => {
    return form.calculateSummary(state, inputs);
  }, [form, state, inputs]);
  const errors = useMemo(() => {
    return form.getErrors(state, inputs, summary);
  }, [form, inputs, state, summary]);
  return { state, actions, summary, errors };
}

export function convertVanillaReducerActionsToReduxToolkitReducers<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
>(
  reducer: VanillaReducer<State, Actions>
): { [K in keyof Actions]: (s: State, arg: { payload: Parameters<Actions[K]>[1] }) => State } {
  return mapValues(reducer.actions, (action) => (s: State, p: any) => action(s, p.payload)) as any;
}
