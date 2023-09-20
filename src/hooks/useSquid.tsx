import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Squid } from '@0xsquid/sdk';

import { CLIENT_NETWORK_CONFIGS, isDydxV4Network } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';

export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export enum SQUID_ERROR_TYPES {
  NotFoundError = 'NotFoundError',
}

const useSquidContext = () => {
  const selectedNetwork = useSelector(getSelectedNetwork);
  const [_, setInitialized] = useState(false);

  const initializeClient = async () => {
    setInitialized(false);
    if (!squid) return;
    await squid.init();
    setInitialized(true);
  };

  const squid = useMemo(
    () =>
      isDydxV4Network(selectedNetwork)
        ? new Squid({ baseUrl: CLIENT_NETWORK_CONFIGS[selectedNetwork]?.endpoints['0xsquid'] })
        : undefined,
    [selectedNetwork]
  );

  useEffect(() => {
    if (squid) {
      initializeClient();
    }
  }, [squid]);

  return squid;
};

type SquidContextType = ReturnType<typeof useSquidContext>;
const SquidContext = createContext<SquidContextType>(undefined);
SquidContext.displayName = '0xSquid';

export const SquidProvider = ({ ...props }) => (
  <SquidContext.Provider value={useSquidContext()} {...props} />
);

export const useSquid = () => useContext(SquidContext);
