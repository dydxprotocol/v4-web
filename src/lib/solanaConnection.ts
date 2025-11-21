import { Connection as SolanaConnection } from '@solana/web3.js';

let solanaConnectionInstance: SolanaConnection | null = null;
let currentRpcUrl: string | null = null;

/**
 * Gets a singleton Solana connection instance.
 * Creates a new connection only if the RPC URL changes.
 */
export const getSolanaConnection = (rpcUrl: string): SolanaConnection => {
  if (!solanaConnectionInstance || currentRpcUrl !== rpcUrl) {
    solanaConnectionInstance = new SolanaConnection(rpcUrl);
    currentRpcUrl = rpcUrl;
  }

  return solanaConnectionInstance;
};
