import { useCallback } from 'react';

import { StargateClient } from '@cosmjs/stargate';
import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem/_types/constants/abis';
import { useBalance, useReadContracts } from 'wagmi';

import { getBalances, getStakingBalances } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { convertBech32Address } from '@/lib/addressUtils';
import { MustBigNumber } from '@/lib/numbers';

import { useAccounts } from './useAccounts';
import { useEnvConfig } from './useEnvConfig';
import { useTokenConfigs } from './useTokenConfigs';

type UseAccountBalanceProps = {
  // Token Items
  addressOrDenom?: string;
  decimals?: number;

  // Chain Items
  chainId?: string | number;
  bech32AddrPrefix?: string;
  rpc?: string;

  isCosmosChain?: boolean;
};

/**
 * 0xSquid uses this 0x address as the chain's default token.
 * @todo We will need to add additional logic here if we 'useAccountBalance' on non-Squid related forms.
 */
export const CHAIN_DEFAULT_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const useAccountBalance = ({
  addressOrDenom,
  bech32AddrPrefix,
  chainId,
  decimals = 0,
  rpc,
  isCosmosChain,
}: UseAccountBalanceProps = {}) => {
  const { evmAddress, dydxAddress } = useAccounts();

  const balances = useAppSelector(getBalances, shallowEqual);
  const { chainTokenDenom, usdcDenom } = useTokenConfigs();
  const evmChainId = Number(useEnvConfig('ethereumChainId'));
  const stakingBalances = useAppSelector(getStakingBalances, shallowEqual);

  const isEVMnativeToken = addressOrDenom === CHAIN_DEFAULT_TOKEN_ADDRESS;

  const evmNative = useBalance({
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    query: {
      enabled: Boolean(!isCosmosChain && isEVMnativeToken),
    },
  });

  const tokenContract = {
    address: addressOrDenom as `0x${string}`,
    abi: erc20Abi,
  } as const;

  const evmToken = useReadContracts({
    contracts: [
      {
        ...tokenContract,
        functionName: 'balanceOf',
        args: [evmAddress ?? '0x'],
      } as const,
      {
        ...tokenContract,
        functionName: 'decimals',
      } as const,
    ],
    query: {
      enabled: Boolean(
        evmAddress && !isCosmosChain && addressOrDenom?.startsWith('0x') && !isEVMnativeToken
      ),
    },
  });

  const cosmosQueryFn = useCallback(async () => {
    if (dydxAddress && bech32AddrPrefix && rpc && addressOrDenom) {
      const address = convertBech32Address({
        address: dydxAddress,
        bech32Prefix: bech32AddrPrefix,
      });

      const client = await StargateClient.connect(rpc);
      const balanceAsCoin = await client.getBalance(address, addressOrDenom);
      await client.disconnect();

      return formatUnits(BigInt(balanceAsCoin.amount), decimals);
    }
    return undefined;
  }, [addressOrDenom, chainId, rpc]);

  const cosmosQuery = useQuery({
    enabled: Boolean(isCosmosChain && dydxAddress && bech32AddrPrefix && rpc && addressOrDenom),
    queryKey: ['accountBalances', chainId, addressOrDenom],
    queryFn: cosmosQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const { value: evmNativeBalance } = evmNative.data ?? {};
  const evmBalance = isEVMnativeToken ? evmNativeBalance : evmToken.data?.[0];
  const balance = isCosmosChain ? cosmosQuery.data : evmBalance;

  const nativeTokenCoinBalance = balances?.[chainTokenDenom];
  const nativeTokenBalance = MustBigNumber(nativeTokenCoinBalance?.amount);

  const usdcCoinBalance = balances?.[usdcDenom];
  const usdcBalance = MustBigNumber(usdcCoinBalance?.amount).toNumber();

  const nativeStakingCoinBalanace = stakingBalances?.[chainTokenDenom];
  const nativeStakingBalance = MustBigNumber(nativeStakingCoinBalanace?.amount).toNumber();

  return {
    balance,
    nativeTokenBalance,
    nativeStakingBalance,
    usdcBalance,
    queryStatus: isCosmosChain ? cosmosQuery.status : evmNative.status,
    isQueryFetching: isCosmosChain ? cosmosQuery.isFetching : evmNative.isFetching,
  };
};
