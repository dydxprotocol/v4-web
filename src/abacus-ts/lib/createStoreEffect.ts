import { type RootState, type RootStore } from '@/state/_store';

type CleanupFn = () => void;

export function createStoreEffect<T>(
  store: RootStore,
  selector: (state: RootState) => T,
  handleChange: (val: NoInfer<T>) => CleanupFn | undefined
): CleanupFn {
  let lastValue = selector(store.getState());
  let lastCleanup = handleChange(lastValue);

  const removeStoreListener = store.subscribe(() => {
    const thisValue = selector(store.getState());
    if (thisValue !== lastValue) {
      lastValue = thisValue;
      // NOTE: some cleanups dispatch actions which cause this to happen recursively.
      // we must ensure that those actions don't change the state they subscribe to or this will go infinitely
      const lastCleanupCached = lastCleanup;
      lastCleanup = undefined;
      lastCleanupCached?.();
      lastCleanup = handleChange(thisValue);
    }
  });

  return () => {
    const lastCleanupCached = lastCleanup;
    lastCleanup = undefined;
    lastCleanupCached?.();
    removeStoreListener();
  };
}
