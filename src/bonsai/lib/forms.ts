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

type KeysOfType<T extends object, U> = Exclude<
  {
    [K in keyof T]: T[K] extends U ? K : never;
  }[keyof T],
  undefined
>;

type InsertStringBeforeFirstUppercase<
  S extends string,
  T extends string,
> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? First extends Lowercase<First>
      ? // If First is neither upper nor lower case (e.g., a symbol), continue checking Rest
        `${First}${InsertStringBeforeFirstUppercase<Rest, T>}`
      : // If First is uppercase, insert "Triggers" before it
        `${T}${First}${Rest}`
    : // If First is lowercase or not a letter, continue checking Rest
      `${First}${InsertStringBeforeFirstUppercase<Rest, T>}`
  : // If we've reached the end of the string and found no uppercase letter, add "Triggers" at the end
    T;

function insertStringBeforeFirstUppercase(original: string, toInsert: string): string {
  for (let i = 0; i < original.length; i += 1) {
    const char = original[i]!;
    const isUppercase = char === char.toUpperCase();
    const isLowercase = char === char.toLowerCase();

    if (isUppercase && !isLowercase) {
      return original.slice(0, i) + toInsert + original.slice(i);
    }
  }
  // No uppercase letter found
  return original + toInsert;
}

export function processVanillaReducerIntoReduxToolkitActions<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
  Name extends string,
  ParentState extends object,
>(
  initialStateForTyping: State,
  parentInitialStateForTyping: ParentState,
  actions: Actions,
  nameToInject: Name,
  stateKey: KeysOfType<NoInfer<ParentState>, NoInfer<State>>
): {
  [K in keyof Actions as K extends string ? InsertStringBeforeFirstUppercase<K, Name> : never]: (
    state: ParentState,
    payload: { payload: Parameters<Actions[K]>[1] }
  ) => NoInfer<ParentState>;
} {
  return Object.fromEntries(
    Object.entries(actions).map(([key, value]) => [
      insertStringBeforeFirstUppercase(key, nameToInject),
      (s: any, p: any) => ({ ...s, [stateKey]: value(s[stateKey], p.payload) }),
    ])
  ) as any;
}

type PickCommonKeys<T, U> = {
  [K in keyof U as K extends keyof T ? K : never]: U[K];
};

// for each key in keysSource, map to value of that key on valuesSource
export function pickCommonKeys<T extends object, U extends object>(
  keysSource: T,
  valuesSource: U
): PickCommonKeys<T, U> {
  const result = {} as PickCommonKeys<T, U>;
  // eslint-disable-next-line no-restricted-syntax
  for (const key in valuesSource) {
    if (key in keysSource) {
      (result as any)[key] = valuesSource[key];
    }
  }

  return result;
}

export function convertVanillaReducerActionsToReduxToolkitReducers<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
>(
  reducer: VanillaReducer<State, Actions>
): { [K in keyof Actions]: (s: State, arg: { payload: Parameters<Actions[K]>[1] }) => State } {
  return mapValues(reducer.actions, (action) => (s: State, p: any) => action(s, p.payload)) as any;
}
