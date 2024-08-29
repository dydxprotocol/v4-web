import { useSyncExternalStore } from 'react';

import { Action, Dispatch, EnhancedStore, UnknownAction } from '@reduxjs/toolkit';
import { QueryClient, QueryObserver, useQuery } from '@tanstack/react-query';
import { isFunction } from 'lodash';

import { getUseBaseQuery } from './useBaseQuery';
import hookifyHooks from './vanillaHooks';

type HookSub<Return> = (val: Return) => void;
type Hookified<Return, Args extends any[]> = {
  subscribe: (handle: HookSub<Return>) => () => void;
  getLatestValue: () => Return | undefined;
  call: (...args: Args) => Return;
  tearDown: () => void;
};

export function hookify<Return, Args extends any[]>(
  hookFn: (...args: Args) => Return
): Hookified<Return, Args> {
  let destroyed = false;
  let mostRecentResult: Return | undefined;
  let subs: HookSub<Return>[] = [];
  const removeSub = (subFn: HookSub<Return>) => {
    subs = subs.filter((s) => s !== subFn);
  };
  const addSub = (sub: HookSub<Return>) => {
    if (destroyed) throw new Error('This hookified fn is tore down');
    subs.push(sub);
    return () => removeSub(sub);
  };
  const notifySubs = (val: Return) => {
    if (destroyed) return;
    subs.forEach((s) => s(val));
  };
  const getLatestValue = () => {
    if (destroyed) throw new Error('This hookified fn is tore down');
    return mostRecentResult;
  };

  const hookified = hookifyHooks.hooked((...args: Args) => {
    const value = hookFn(...args);
    // todo custom equality fns
    if (mostRecentResult !== value) {
      mostRecentResult = value;
      notifySubs(value);
    }
    return value;
  });

  return {
    subscribe: addSub,
    getLatestValue,
    call: (...args: Args) => {
      if (destroyed) throw new Error('This hookified fn is tore down');
      return hookified(...args);
    },
    tearDown: () => {
      destroyed = true;
      subs = [];
      hookifyHooks.dropEffect(hookified);
    },
  };
}

// for use in react
export const useHookified = <ReturnType>(hookified: Hookified<ReturnType, any>) => {
  return useSyncExternalStore(hookified.subscribe, hookified.getLatestValue);
};
// for use in other hookfied functions
export const useHookifiedHf = <ReturnType>(hookified: Hookified<ReturnType, any>) => {
  return hookifyHooks.useSyncExternalStore(hookified.subscribe, hookified.getLatestValue);
};

type HookedSelector<RootStateType, A extends Action, ReturnType> = {
  subscribe: (handle: (val: ReturnType) => void) => () => void;
  getValue: () => ReturnType;
  dispatchValue: (
    handle: (
      dispatch: Dispatch<A>,
      value: ReturnType
    ) => HookedSelector<RootStateType, A, ReturnType>
  ) => void;
  tearDown: () => void;
  __hooked_selector__: true;
  __state_type__?: RootStateType;
};

export function hookedSelectors<RootStateType, A extends Action = UnknownAction>(
  store: EnhancedStore<RootStateType, A>,
  reactQueryClient: QueryClient
) {
  type GetReturn<T extends readonly any[]> = {
    [K in keyof T]: T[K] extends HookedSelector<RootStateType, A, infer Ret>
      ? Ret
      : T[K] extends (...args: any[]) => infer R
        ? R
        : never;
  };

  // types are technically a lie but close enough to work
  const useQueryHf = getUseBaseQuery(reactQueryClient, QueryObserver) as typeof useQuery;

  const useAppSelectorHf = <T>(selector: (state: RootStateType) => T) => {
    return hookifyHooks.useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  };

  const useDispatchHf = () => store.dispatch;

  const useHookedSelectorHf = <ReturnType>(
    selector: HookedSelector<RootStateType, A, ReturnType>
  ) => {
    return hookifyHooks.useSyncExternalStore(selector.subscribe, selector.getValue);
  };

  const useHookedSelector = <ReturnType>(
    selector: HookedSelector<RootStateType, A, ReturnType>
  ) => {
    return useSyncExternalStore(selector.subscribe, selector.getValue);
  };

  const createHookedSelector = <
    ReturnType,
    DepsType extends readonly (
      | HookedSelector<RootStateType, A, any>
      | ((arg: RootStateType) => any)
    )[],
  >(
    deps: [...DepsType],
    hookFn: (...args: GetReturn<DepsType>) => ReturnType
  ): HookedSelector<RootStateType, A, ReturnType> => {
    // we just call the useX hooks for you...
    const hooked = hookify(() => {
      const args = deps.map((dep) => {
        if (isFunction(dep)) {
          return useAppSelectorHf(dep);
        }
        return useHookedSelectorHf(dep);
      });
      return hookFn(...(args as any));
    });

    const result: HookedSelector<RootStateType, A, ReturnType> = {
      __hooked_selector__: true,
      __state_type__: undefined,
      getValue: () => hooked.getLatestValue()!,
      dispatchValue: (listener) => {
        hooked.subscribe((v) => listener(store.dispatch, v));
        return result;
      },
      subscribe: hooked.subscribe,
      tearDown: hooked.tearDown,
    };
    return result;
  };

  return {
    createHookedSelector,
    useHookedSelector,

    useDispatchHf,
    useQueryHf,
    useHookedSelectorHf,
    useAppSelectorHf,
  };
}
