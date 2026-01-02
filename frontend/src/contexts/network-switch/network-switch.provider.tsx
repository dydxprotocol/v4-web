import type { FC, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { getDefaultNetwork } from '@/lib/env';
import type { Network } from '@/models/network';
import type { NetworkSwitchContextType } from './network-switch.context';
import { NetworkSwitchContext } from './network-switch.context';

type NetworkSwitchContextProviderProps = {
  children: (ctx: NetworkSwitchContextType) => ReactNode;
};

export const NetworkSwitchContextProvider: FC<NetworkSwitchContextProviderProps> = ({
  children,
}) => {
  const [currentNetwork, setCurrentNetwork] = useState<Network>(getDefaultNetwork());

  const contextValue = useMemo<NetworkSwitchContextType>(
    () => ({
      changeNetwork: setCurrentNetwork,
      getCurrentNetwork: () => currentNetwork,
    }),
    [currentNetwork]
  );

  const childrenMemoized = useMemo(() => children(contextValue), [children, contextValue]);

  return (
    <NetworkSwitchContext.Provider value={contextValue}>
      {childrenMemoized}
    </NetworkSwitchContext.Provider>
  );
};
