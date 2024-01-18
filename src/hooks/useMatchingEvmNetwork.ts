import { useCallback, useEffect, useMemo } from 'react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useSwitchNetwork as useSwitchNetworkPrivy } from '@privy-io/wagmi-connector';
import { WalletConnectionType } from '@/constants/wallets';

import { useWalletConnection } from './useWalletConnection';

export const useMatchingEvmNetwork = ({
  chainId,
  switchAutomatically = false,
  onError,
}: {
  chainId?: string | number;
  switchAutomatically?: boolean;
  onError?: (error: Error) => void;
}) => {
  const { chain } = useNetwork();
  const { walletConnectionType } = useWalletConnection();
  const { isLoading, switchNetworkAsync } = useSwitchNetwork({ onError });
  const { isLoading: isLoadingPrivy, switchNetworkAsync: switchNetworkAsyncPrivy } =
    useSwitchNetworkPrivy({ onError });

  // If chainId is not a number, we can assume it is a non EVM compatible chain
  const isMatchingNetwork = useMemo(
    () => Boolean(chain && chainId && typeof chainId === 'number' && chain.id === chainId),
    [chainId, chain]
  );

  const matchNetwork = useCallback(async () => {
    if (!isMatchingNetwork) {
      if (walletConnectionType === WalletConnectionType.Privy) {
        await switchNetworkAsyncPrivy?.(Number(chainId));
      } else {
        await switchNetworkAsync?.(Number(chainId));
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
    isSwitchingNetwork: isLoading || isLoadingPrivy,
  };
};
