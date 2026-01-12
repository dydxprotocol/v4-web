import { useContext } from 'react';
import { type Signal, useSignal } from '@preact/signals-react';
import type { RootState, StarboardClient } from 'fuel-ts-sdk/client';
import { useSelector } from 'react-redux';
import { FuelTsSdkContext } from '../contexts';

export function useSdk(): StarboardClient {
  const client = useContext(FuelTsSdkContext);
  if (!client) {
    throw new Error('useSdk must be used within SdkProvider');
  }
  return client;
}

export function useTradingSdk() {
  const client = useSdk();
  return client.trading;
}

export function useSdkQuery<T>(selector: (state: RootState) => T): T {
  return useSelector(selector);
}

export function useSdkQuerySignal<T>(query: () => T): Signal<T> {
  const _signal = useSignal<T>(query());

  useSdkQuery(() => {
    // eslint-disable-next-line react-hooks/immutability
    _signal.value = query();
  });

  return _signal;
}
