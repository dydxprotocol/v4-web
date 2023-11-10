import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Squid } from '@0xsquid/sdk';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const STATUS_ERROR_GRACE_PERIOD = 300_000;

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
      new Squid({
        baseUrl: ENVIRONMENT_CONFIG_MAP[selectedNetwork]?.endpoints['0xsquid'],
        integratorId: ENVIRONMENT_CONFIG_MAP[selectedNetwork]?.squidIntegratorId,
      }),
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
const SquidContext = createContext<SquidContextType | undefined>(undefined);
SquidContext.displayName = '0xSquid';

export const SquidProvider = ({ ...props }) => (
  <SquidContext.Provider value={useSquidContext()} {...props} />
);

export const useSquid = () => useContext(SquidContext);
