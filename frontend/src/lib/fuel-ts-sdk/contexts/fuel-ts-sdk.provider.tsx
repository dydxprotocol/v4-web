/* eslint-disable react-hooks/refs */
import { getEnv } from '@/lib/env';
import { createStarboardClient } from 'fuel-ts-sdk/client';
import { useRef, type PropsWithChildren } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import type { FuelTsSdkContextType } from './fuel-ts-sdk.context';
import { FuelTsSdkContext } from './fuel-ts-sdk.context';

interface FuelTsSdkProviderProps extends PropsWithChildren {
  indexerUrl?: string;
}

export function FuelTsSdkProvider({ children, indexerUrl }: FuelTsSdkProviderProps) {
  const clientRef = useRef<FuelTsSdkContextType | null>(null);

  if (clientRef.current == null) {
    clientRef.current = createStarboardClient({
      indexerUrl: indexerUrl ?? getEnv('VITE_INDEXER_URL'),
    });
  }

  const client = clientRef.current;

  return (
    <ReduxProvider store={client.store}>
      <FuelTsSdkContext.Provider value={client}>{children}</FuelTsSdkContext.Provider>
    </ReduxProvider>
  );
}