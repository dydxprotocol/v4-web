import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Squid } from '@0xsquid/sdk';

import { DydxV4Network, isDydxV4Network } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';

const SQUID_BASE_URL: Record<DydxV4Network, string | undefined> = {
  [DydxV4Network.V4Testnet2]: 'https://squid-api-git-feat-cosmos-maintestnet-0xsquid.vercel.app',
  [DydxV4Network.V4Staging]: undefined,
  [DydxV4Network.V4Local]: undefined,
  [DydxV4Network.V4Mainnet]: 'https://api.0xsquid.com',
};

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
        ? new Squid({ baseUrl: SQUID_BASE_URL[selectedNetwork as DydxV4Network] })
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
