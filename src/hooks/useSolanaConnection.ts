import React from 'react';

import { Connection as SolanaConnection } from '@solana/web3.js';

import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';

// Create and export a single instance of Connection
export const useSolanaConnection = () => {
  const endpointsConfig = useEndpointsConfig();

  const connection = React.useMemo(
    () => new SolanaConnection(endpointsConfig.solanaRpcUrl),
    [endpointsConfig.solanaRpcUrl]
  );

  return connection;
};
