import { useMemo, type PropsWithChildren } from 'react';
import { createStarboardClient } from 'fuel-ts-sdk';
import { getEnv } from '@/lib/env';
import { StarboardClientContext } from './StarboardClient.context';

interface StarboardClientProviderProps extends PropsWithChildren {}

export function StarboardClientProvider({ children }: StarboardClientProviderProps) {
  const client = useMemo(
    () => createStarboardClient({ indexerUrl: getEnv('VITE_INDEXER_URL') }),
    []
  );

  return (
    <StarboardClientContext.Provider value={client}>{children}</StarboardClientContext.Provider>
  );
}
