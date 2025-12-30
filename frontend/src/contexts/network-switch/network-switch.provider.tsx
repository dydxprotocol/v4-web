import type { FC, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { getEnv } from '@/lib/env';
import type { NetworkSwitchContextType } from './network-switch.context';
import { NetworkSwitchContext } from './network-switch.context';

type NetworkSwitchContextProviderProps = {
  children: (ctx: NetworkSwitchContextType) => ReactNode;
};

export const NetworkSwitchContextProvider: FC<NetworkSwitchContextProviderProps> = ({
  children,
}) => {
  const [indexerUrl, setIndexerUrl] = useState(getEnv('VITE_INDEXER_URL'));

  const contextValue = useMemo<NetworkSwitchContextType>(
    () => ({
      changeNetworkUrl: setIndexerUrl,
      getNetworkUrl: () => indexerUrl,
    }),
    [indexerUrl]
  );

  const childrenMemoized = useMemo(() => children(contextValue), [children, contextValue]);

  return (
    <NetworkSwitchContext.Provider value={contextValue}>
      {childrenMemoized}
    </NetworkSwitchContext.Provider>
  );
};
