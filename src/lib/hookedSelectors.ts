import { useSyncExternalStore } from 'react';

import { Action, Dispatch, createListenerMiddleware } from '@reduxjs/toolkit';

import hooks from './vanillaHooks';

type HookedSelector<RootStateType, ReturnType> = {
  subscribe: (handle: (val: ReturnType) => void) => () => void;
  getValue: () => ReturnType;
  __hooked_selector__: true;
};

interface IHookedSelectorArgs {
  optimistic: boolean;
}

export function hookedSelectors<RootStateType, RootDispatchType extends Dispatch<Action>>() {
  let allBaseSelectors = [];

  type HookMeta<
    ReturnType,
    DepsType extends readonly (
      | HookedSelector<RootStateType, any>
      | ((arg: RootStateType) => any)
    )[],
  > = {
    children: readonly HookedSelector<RootStateType, any>[];
    deps: readonly HookedSelector<RootStateType, any>[];

    mostRecentValue: ReturnType;
    hooked: (...args: GetReturn<DepsType>) => ReturnType;
  };

  type GetReturn<T extends readonly any[]> = {
    [K in keyof T]: T[K] extends HookedSelector<RootStateType, infer Ret>
      ? Ret
      : T[K] extends (...args: any[]) => infer R
        ? R
        : never;
  };

  const createHookedSelector = <
    ReturnType,
    DepsType extends readonly (
      | HookedSelector<RootStateType, any>
      | ((arg: RootStateType) => any)
    )[],
  >(
    deps: [...DepsType],
    hookFn: (...args: GetReturn<DepsType>) => ReturnType,
    opts?: IHookedSelectorArgs
  ): HookedSelector<RootStateType, ReturnType> => {
    const { optimistic } = opts ?? {};

    const hooked = hooks.hooked(hookFn);
    const metadata: HookMeta<ReturnType> = {};

    const selector: HookedSelector<RootStateType, ReturnType> = {
      __hooked_selector__: true,
      getValue() {},
      subscribe() {},
    };
    return selector;
  };

  const cleanupHookedSelector = (selector: HookedSelector<RootStateType, any>): void => {};

  const listenerMiddleware = createListenerMiddleware<RootStateType, RootDispatchType>();
  listenerMiddleware.startListening({
    predicate: () => true,
    effect: (_someAction, { getState, dispatch }) => {},
  });

  const useHookedSelector = <ReturnType>(selector: HookedSelector<RootStateType, ReturnType>) => {
    // we may be breaking invariant since getValue technically updates before subscribe in current implementation
    // just test and see if it's okay
    return useSyncExternalStore(selector.subscribe, selector.getValue);
  };

  return {
    hookedSelectorMiddleware: listenerMiddleware,
    createHookedSelector,
    cleanupHookedSelector,
    useHookedSelector,
  };
}

type TestState = { x: number; y: string };
const { createHookedSelector } = hookedSelectors<TestState, Dispatch<Action>>();
const r = createHookedSelector([(s) => s.x, (s) => s.y], (arg1, arg2) => arg1);
const p = createHookedSelector([r, (s) => s.y], (arg1, arg2) => arg1);
