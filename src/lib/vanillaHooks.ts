type RunnableEffect = {
  type: 'runnable';
  callback: () => void | (() => void);
  cleanup: null | void | (() => void);
  cleaned: boolean;
  guards?: any[];
  hook: Function;
};
type RefEffect = { type: 'ref'; val: { current: any } };
type MemoEffect = { type: 'memo'; value: any; guards: any[] };
type StateEffect = { type: 'state'; set: (arg: any) => void; value: any };
type Effect = RefEffect | RunnableEffect | StateEffect | MemoEffect;

type HookInfo<A extends any[] = any[], T = any> = {
  hook: (...args: A) => T;
  handleInternalRerender: (params: {
    hooked: (...args: A) => T;
    context: any | null;
    args: A | null;
  }) => void;
  context: any | null;
  args: A | null;
  queuedToExecute: boolean;
  index: number;
  state: Effect[];
};

const hooks = (function hooks() {
  let info: HookInfo | null = null;
  let schedule: Set<HookInfo> = new Set();
  const fx = new WeakMap<Function, Set<RunnableEffect>>();
  const effects: RunnableEffect[] = [];
  const layoutEffects: RunnableEffect[] = [];

  const basicRerunHook: HookInfo['handleInternalRerender'] = ({ args, context, hooked }) =>
    hooked.apply(context, args!);

  const invoke = (effect: RunnableEffect): void => {
    const { callback, cleanup, hook } = effect;
    if (isFunction(cleanup)) {
      fx.get(hook)?.delete(effect);
      cleanup();
    }

    const newCleanup = callback();
    effect.cleanup = newCleanup;
    if (isFunction(effect.cleanup)) {
      fx.get(hook)?.add(effect);
    }
  };

  const runSchedule = (): void => {
    const previous = schedule;
    schedule = new Set();
    previous.forEach(({ hook, context, args, queuedToExecute, handleInternalRerender }) => {
      // avoid running schedules when the hook is
      // re-executed before such schedule happens
      if (queuedToExecute) {
        handleInternalRerender({ hooked: hook, context, args });
      }
    });
  };

  function different(this: any[], value: any, i: number): boolean {
    return value !== this[i];
  }

  const dropEffect = (hook: Function): void => {
    const theseEffects = fx.get(hook);
    if (theseEffects)
      wait.then(() => {
        theseEffects.forEach((effect) => {
          effect.cleanup?.();
          effect.cleanup = null;
          effect.cleaned = true;
        });
        theseEffects.clear();
      });
  };

  const getInfo = (): HookInfo | null => info;

  const hasEffect = (hook: Function): boolean => fx.has(hook);

  const isFunction = (f: any): f is Function => typeof f === 'function';

  const hooked = <A extends any[], T>(
    callback: (...args: A) => T,
    handleInternalRerender: (params: {
      hooked: (...args: A) => T;
      context: any | null;
      args: A | null;
    }) => void = basicRerunHook
  ): ((...args: A) => T) => {
    const current: HookInfo<A, T> = {
      hook,
      handleInternalRerender,
      context: null,
      args: null,
      queuedToExecute: false,
      index: 0,
      state: [],
    };
    return hook;
    function hook(this: Function, ...args: A): any {
      const prev = info;
      info = current as HookInfo;
      current.queuedToExecute = false;
      current.index = 0;
      try {
        return callback.apply((current.context = this), (current.args = args));
      } finally {
        info = prev;
        if (effects.length) {
          wait.then(effects.forEach.bind(effects.splice(0), invoke));
        }
        if (layoutEffects.length) {
          layoutEffects.splice(0).forEach(invoke);
        }
      }
    }
  };

  const reschedule = (thisHookInfo: HookInfo): void => {
    if (!schedule.has(thisHookInfo)) {
      thisHookInfo.queuedToExecute = true;
      schedule.add(thisHookInfo);
      wait.then(runSchedule);
    }
  };

  const wait: Promise<void> = Promise.resolve();

  type Context<T> = {
    listeners: Set<HookInfo>;
    provide: (newValue: T) => void;
    value: T;
  };

  const createContext = <T>(value: T): Context<T> => ({
    listeners: new Set(),
    provide,
    value,
  });

  const useContext = <T>({ listeners, value }: Context<T>): T => {
    listeners.add(getInfo()!);
    return value;
  };

  function provide<T>(this: Context<T>, newValue: T): void {
    const { listeners, value } = this;
    if (value !== newValue) {
      this.listeners = new Set();
      this.value = newValue;
      listeners.forEach(({ hook, context, args, handleInternalRerender }) => {
        handleInternalRerender({ hooked: hook, context, args });
      });
    }
  }

  const useCallback = <T extends Function>(fn: T, guards: any[]): T => useMemo(() => fn, guards);

  const useMemo = <T>(memo: () => T, guards: any[]): T => {
    const thisHookInfo = getInfo()!;
    const { index, state } = thisHookInfo;

    if (
      index === state.length ||
      !guards ||
      guards.some(different, (state[index] as MemoEffect).guards)
    ) {
      state[index] = { type: 'memo', value: memo(), guards };
    }

    // eslint-disable-next-line no-plusplus
    return (state[thisHookInfo.index++] as MemoEffect).value;
  };

  const createEffect =
    (stack: RunnableEffect[]) =>
    (callback: () => void | (() => void), guards?: any[]): void => {
      const thisHookInfo = getInfo()!;
      const { index, state, hook } = thisHookInfo;
      const call = index === state.length;
      // eslint-disable-next-line no-plusplus
      thisHookInfo.index++;
      if (call) {
        if (!fx.has(hook)) fx.set(hook, new Set());
        state[index] = {
          type: 'runnable',
          callback,
          guards,
          hook,
          cleanup: null,
          cleaned: false,
        };
      }
      const ef = state[index] as RunnableEffect;
      if (call || !guards || guards.some(different, ef.guards)) {
        stack.push(ef);
      }
      ef.callback = callback;
      ef.guards = guards;
    };

  const useEffect = createEffect(effects);

  const useLayoutEffect = createEffect(layoutEffects);

  const getValue = <T>(value: T, f: ((value: T) => T) | T): T => (isFunction(f) ? f(value) : f);

  const useReducer = <S, A>(
    reducer: (state: S, action: A) => S,
    initialState: S | (() => S),
    init?: (arg: S | (() => S)) => S
  ): [S, (action: A) => void] => {
    const thisHookInfo = getInfo()!;
    const { index, state } = thisHookInfo;
    if (index === state.length)
      state.push({
        type: 'state',
        value: isFunction(init) ? init(initialState) : getValue(undefined, initialState),
        set: (value: A) => {
          const ef = state[index] as StateEffect;
          ef.value = reducer(ef.value as S, value);
          reschedule(thisHookInfo);
        },
      });
    // eslint-disable-next-line no-plusplus
    const { value, set } = state[thisHookInfo.index++] as StateEffect;
    return [value, set];
  };

  const useState = <S>(
    initialState: S | (() => S)
  ): [S, (newState: S | ((prevState: S) => S)) => void] =>
    useReducer((_, value) => getValue(_, value), initialState);

  const useRef = <T>(initialValue: T): { current: T } => {
    const thisHookInfo = getInfo()!;
    const { index, state } = thisHookInfo;
    if (index === state.length) {
      state.push({ type: 'ref', val: { current: initialValue } });
    }
    // eslint-disable-next-line no-plusplus
    return (state[thisHookInfo.index++] as RefEffect).val;
  };

  return {
    createContext,
    dropEffect,
    hasEffect,
    hooked,
    basicRerunHook,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    wait,
  };
})();

export default hooks;
