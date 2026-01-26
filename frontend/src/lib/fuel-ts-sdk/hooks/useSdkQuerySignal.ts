import type { Signal } from '@preact/signals-react';
import { useSignal } from '@preact/signals-react';
import { useSdk } from './useSdk';
import { useSdkQuery } from './useSdkQuery';

export function useSdkQuerySignal<T>(query: (sdk: ReturnType<typeof useSdk>) => T): Signal<T> {
  const sdk = useSdk();
  const _signal = useSignal<T>(query(sdk));

  useSdkQuery((sdk) => {
    // eslint-disable-next-line react-hooks/immutability
    _signal.value = query(sdk);
  });

  return _signal;
}
