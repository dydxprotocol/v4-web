import { useContext } from 'react';
import type { StarboardClient } from 'fuel-ts-sdk/client';
import { FuelTsSdkContext } from '../contexts';

export function useSdk(): StarboardClient {
  const client = useContext(FuelTsSdkContext);
  if (!client) {
    throw new Error('useSdk must be used within SdkProvider');
  }
  return client;
}
