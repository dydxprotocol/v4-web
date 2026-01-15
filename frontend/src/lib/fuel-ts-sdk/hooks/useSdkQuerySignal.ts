import type { Signal } from '@preact/signals-react';
import { useSignal } from '@preact/signals-react';
import { useSdkQuery } from './useSdkQuery';

export function useSdkQuerySignal<T>(query: () => T): Signal<T> {
  const _signal = useSignal<T>(query());

  useSdkQuery(() => {
    // eslint-disable-next-line react-hooks/immutability
    _signal.value = query();
  });

  return _signal;
}
