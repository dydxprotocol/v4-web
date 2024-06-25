import { useCallback } from 'react';

import { StargateClient } from '@cosmjs/stargate';
import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';
import { formatUnits } from 'viem';
import { useBalance as useBalanceWagmi } from 'wagmi';

import { EvmAddress } from '@/constants/wallets';

import { getBalances, getStakingBalances } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

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
  rpc?: string;

  isCosmosChain?: boolean;
  cosmosAddress?: string;
};

/**
 * 0xSquid uses this 0x address as the chain's default token.
 * @todo We will need to add additional logic here if we 'useAccountBalance' on non-Squid related forms.
 */
export const CHAIN_DEFAULT_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const useAccountBalance = ({
  addressOrDenom,
  chainId,
  decimals = 0,
  rpc,
  isCosmosChain,
  cosmosAddress,
}: UseAccountBalanceProps = {}) => {
  const { evmAddress, dydxAddress } = useAccounts();

  const balances = useAppSelector(getBalances, shallowEqual);
  const { chainTokenDenom, usdcDenom } = useTokenConfigs();
  const evmChainId = Number(useEnvConfig('ethereumChainId'));
  const stakingBalances = useAppSelector(getStakingBalances, shallowEqual);

  const evmQuery = useBalanceWagmi({
    enabled: Boolean(!isCosmosChain && addressOrDenom?.startsWith('0x')),
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    token:
      addressOrDenom === CHAIN_DEFAULT_TOKEN_ADDRESS ? undefined : (addressOrDenom as EvmAddress),
    watch: true,
  });

  const cosmosQueryFn = useCallback(async () => {
    if (dydxAddress && cosmosAddress && rpc && addressOrDenom) {
      const client = await StargateClient.connect(rpc);
      const balanceAsCoin = await client.getBalance(cosmosAddress, addressOrDenom);
      await client.disconnect();

      return formatUnits(BigInt(balanceAsCoin.amount), decimals);
    }
    return undefined;
  }, [addressOrDenom, cosmosAddress, decimals, dydxAddress, rpc]);

  const cosmosQuery = useQuery({
    enabled: Boolean(isCosmosChain && dydxAddress && cosmosAddress && rpc && addressOrDenom),
    queryKey: ['accountBalances', chainId, cosmosAddress, addressOrDenom],
    queryFn: cosmosQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });
  const { formatted: evmBalance } = evmQuery.data ?? {};
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
    queryStatus: isCosmosChain ? cosmosQuery.status : evmQuery.status,
    isQueryFetching: isCosmosChain ? cosmosQuery.isFetching : evmQuery.fetchStatus === 'fetching',
  };
};
