import { useEffect, useState } from 'react';
import type { ChainData, TokenData } from '@0xsquid/sdk';

import squidRouter from '@/lib/squidRouter';
import { WAGMI_SUPPORTED_CHAINS } from '@/lib/wagmi';

/**
 * @description hook to return chains and tokens supported by squid
 * @note Limit to EVM chains | Cosmos chains can only be used as destination on 0xSquid as of 02/21/2023
 */
export const useSquidData = (selectedChainType: 'cosmos' | 'evm') => {
  const [, setHasInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      await squidRouter.initializeClient();
      setHasInitialized(true);
    })();
  }, []);

  const chainData: ChainData[] = squidRouter.getChains();
  const tokenData: TokenData[] = squidRouter.getTokens();
  const wagmiChainIds = Object.fromEntries(
    WAGMI_SUPPORTED_CHAINS.map((supportedChain) => [supportedChain.id, supportedChain])
  );

  return {
    chains: chainData.filter(({ chainId, chainType }) =>
      selectedChainType === 'evm' ? wagmiChainIds[chainId] : chainType === 'cosmos'
    ),
    tokens: tokenData,
  };
};
