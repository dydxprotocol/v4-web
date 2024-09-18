import { useSyncExternalStore } from 'react';

import { Action, Dispatch, EnhancedStore, UnknownAction } from '@reduxjs/toolkit';
import { QueryClient, QueryObserver, useQuery } from '@tanstack/react-query';
import { isFunction } from 'lodash';

import { getUseBaseQuery } from './useBaseQuery';
import hookifyHooks from './vanillaHooks';

type HookSub<Return> = (val: Return) => void;

// wraps a function in vanilla hooks and returns an interface that lets users
// set the arguments with call() and subscribe to all return values with subscribe()
type Hookified<Return, Args extends any[]> = {
  // callback whenever the return value changes for any reason
  subscribe: (handle: HookSub<Return>) => () => void;

  // will return undefined if never called or destroyed
  getLatestValue: () => Return | undefined;

  // sets the arguments and returns the first return value after running with these args
  // further triggered changes available via subscribe()
  call: (...args: Args) => Return;

  // once torn down, cannot be restarted
  tearDown: () => void;
};

function hookify<Return, Args extends any[]>(
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

// a hooked selector is a function that uses hooks and has a set of dependencies which
// are either other hookified selectors or selectors on the root store/state
type HookedSelector<RootStateType, A extends Action, ReturnType> = {
  // must call either subscribe or start to begin the selector
  start: () => void;
  subscribe: (handle: (val: ReturnType) => void) => () => void;

  // turn it off and tear down any subscriptions/effects. This operation is permanent, start won't restart.
  tearDown: () => void;

  // returns the latest value, does not trigger refresh or rerun the function
  getValue: () => ReturnType;

  // shortcut for dispatching the return value of the selector back to the state
  dispatchValue: (
    handle: (dispatch: Dispatch<A>, value: ReturnType) => void
  ) => HookedSelector<RootStateType, A, ReturnType>;

  // internal state/type preservation
  __hooked_selector__: true;
  __state_type__?: RootStateType;
};

// initialize a set of hooked selector helper functions with a given store and react query client
export function hookedSelectors<RootStateType, DispatchType, A extends Action = UnknownAction>(
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

  const useDispatchHf = () => store.dispatch as DispatchType;

  const useHookedSelectorHf = <ReturnType>(
    selector: HookedSelector<RootStateType, A, ReturnType>
  ) => {
    selector.start();
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
    let running = false;
    let destroyed = false;
    let dispatchListenersToAdd: Array<(dispatch: Dispatch<A>, value: ReturnType) => void> = [];

    const hooked = hookify(() => {
      // we just call the useX hooks for you...
      const args = deps.map((dep) => {
        if (isFunction(dep)) {
          return useAppSelectorHf(dep);
        }
        return useHookedSelectorHf(dep);
      });
      return hookFn(...(args as any));
    });

    const init = () => {
      if (running || destroyed) {
        return;
      }
      running = true;
      // first call
      hooked.call();
      dispatchListenersToAdd.forEach((listener) => {
        hooked.subscribe((v) => listener(store.dispatch, v));
        listener(store.dispatch, result.getValue());
      });
      dispatchListenersToAdd = [];
    };

    const result: HookedSelector<RootStateType, A, ReturnType> = {
      __hooked_selector__: true,
      __state_type__: undefined,
      getValue: () => {
        if (!running) {
          throw new Error('Called getValue before initializing');
        }
        return hooked.getLatestValue()!;
      },
      dispatchValue: (listener) => {
        if (running) {
          hooked.subscribe((v) => listener(store.dispatch, v));
          listener(store.dispatch, result.getValue());
        } else {
          dispatchListenersToAdd.push(listener);
        }
        return result;
      },
      subscribe: (arg) => {
        init();
        return hooked.subscribe(arg);
      },
      start: () => init(),
      tearDown: () => {
        if (!running || destroyed) {
          throw new Error('Hooked Selector was already shut down');
        }
        running = false;
        destroyed = true;
        return hooked.tearDown();
      },
    };
    return result;
  };

  return {
    // core function for creating an unitialized hooked selector bound to our state and query observer instance
    createHookedSelector,

    // from react, get hooked selector value
    useHookedSelector,

    // hooks for use in hookified selectors:

    // react useQuery equivalent
    useQueryHf,

    // everything below here should probably never be used. Instead, use dependencies and .dispatchValue()
    // get dispatch
    useDispatchHf,
    // use hooked selector value
    useHookedSelectorHf,
    // use root state selector value
    useAppSelectorHf,
  };
}
