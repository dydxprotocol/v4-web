import { type RootState, type RootStore } from '@/state/_store';

type CleanupFn = () => void;

export function createStoreEffect<T>(
  store: RootStore,
  selector: (state: RootState) => T,
  handleChange: (val: NoInfer<T>) => CleanupFn | undefined
): CleanupFn {
  let lastValue = selector(store.getState());
  let lastCleanup = handleChange(lastValue);

  return store.subscribe(() => {
    const thisValue = selector(store.getState());
    if (thisValue !== lastValue) {
      lastCleanup?.();
      lastValue = thisValue;
      lastCleanup = handleChange(thisValue);
    }
  });
}
