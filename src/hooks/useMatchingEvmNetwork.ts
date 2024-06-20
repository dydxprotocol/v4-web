import { useCallback, useEffect, useMemo } from 'react';

import { useWallets } from '@privy-io/react-auth';
import { useAccount, useSwitchChain } from 'wagmi';

import { WalletConnectionType } from '@/constants/wallets';

import { useWalletConnection } from './useWalletConnection';

export const useMatchingEvmNetwork = ({
  chainId,
  switchAutomatically = false,
  onError,
  onSuccess,
}: {
  chainId?: string | number;
  switchAutomatically?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}) => {
  const { chain } = useAccount();
  const { walletConnectionType } = useWalletConnection();
  const { isPending, switchChainAsync } = useSwitchChain();
  const { wallets } = useWallets();

  const isMatchingNetwork = useMemo(() => {
    if (walletConnectionType === WalletConnectionType.CosmosSigner) {
      return true;
    }
    // If chainId is not a number, we can assume it is a non EVM compatible chain
    return Boolean(chain && chainId && typeof chainId === 'number' && chain.id === chainId);
  }, [walletConnectionType, chain, chainId]);

  const matchNetwork = useCallback(async () => {
    if (!isMatchingNetwork) {
      if (walletConnectionType === WalletConnectionType.Privy) {
        await wallets?.[0].switchChain(Number(chainId));
      } else {
        await switchChainAsync?.({ chainId: Number(chainId) }, { onError, onSuccess });
      }
    }
  }, [chainId, chain]);

  useEffect(() => {
    if (switchAutomatically) {
      matchNetwork();
    }
  }, [chainId, chain]);

  return {
    isMatchingNetwork,
    matchNetwork,
    isSwitchingNetwork: isPending,
  };
};
