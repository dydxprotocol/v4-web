import { useEffect, useRef } from 'react';

export function useReloadObserver<T extends object>(dependencies: T) {
  const previousRenderDepsRef = useRef<T | null>(null);

  useEffect(() => {
    const previousBatch = previousRenderDepsRef.current;

    if (!previousBatch) {
      previousRenderDepsRef.current = dependencies;
      return;
    }

    const changedKeys = new Set<string>();

    Object.entries(previousBatch).map(([iteratedKey, prevValue]) => {
      if (!(iteratedKey in dependencies))
        throw new Error('Observed object structure has changed since the last render');
      const hasValuesChanged = dependencies[iteratedKey as keyof T] !== prevValue;
      if (hasValuesChanged) changedKeys.add(iteratedKey);
    });

    // eslint-disable-next-line no-console
    console.log(changedKeys);
  }, [dependencies]);
}
