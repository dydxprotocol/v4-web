import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';

import { getSolanaConnection } from '@/lib/solanaConnection';

/**
 * React hook that returns a singleton Solana connection instance.
 * Automatically uses the RPC URL from endpoints config.
 */
export const useSolanaConnection = () => {
  const { solanaRpcUrl } = useEndpointsConfig();
  return getSolanaConnection(solanaRpcUrl);
};
