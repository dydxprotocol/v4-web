/* eslint-disable react-hooks/refs */
import { type PropsWithChildren, useRef } from 'react';
import { createStarboardClient } from 'fuel-ts-sdk/client';
import { Provider as ReduxProvider } from 'react-redux';
import type { FuelTsSdkContextType } from './fuel-ts-sdk.context';
import { FuelTsSdkContext } from './fuel-ts-sdk.context';

interface FuelTsSdkProviderProps extends PropsWithChildren {
  indexerUrl: string;
}

export function FuelTsSdkProvider({ children, indexerUrl }: FuelTsSdkProviderProps) {
  const clientRef = useRef<FuelTsSdkContextType | null>(null);

  if (clientRef.current == null) {
    clientRef.current = createStarboardClient({
      indexerUrl: indexerUrl,
    });
  }

  const client = clientRef.current;

  return (
    <ReduxProvider store={client.store}>
      <FuelTsSdkContext.Provider value={client}>{children}</FuelTsSdkContext.Provider>
    </ReduxProvider>
  );
}
