import { useContext } from 'react';
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
