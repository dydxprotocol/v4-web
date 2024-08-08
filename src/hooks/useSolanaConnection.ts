import { Connection as SolanaConnection } from '@solana/web3.js';

import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';

// Create and export a single instance of Connection
export const useSolanaConnection = () => {
  const endpointsConfig = useEndpointsConfig();

  return new SolanaConnection(endpointsConfig.solanaRpcUrl);
};
