import { useCallback, useMemo } from 'react';

import { getLazyStargateClient } from '@/bonsai/lib/lazyDynamicLibs';
import { BonsaiCore, BonsaiHooks } from '@/bonsai/ontology';
import { QueryObserverResult, RefetchOptions, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { erc20Abi, formatUnits } from 'viem';
import { useBalance, useReadContracts } from 'wagmi';

import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import { EvmAddress, WalletNetworkType } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isNativeDenom } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';
import { useEnvConfig } from './useEnvConfig';
import { useTokenConfigs } from './useTokenConfigs';
import { useWalletConnection } from './useWalletConnection';

type UseAccountBalanceProps = {
  // Token Items
  addressOrDenom?: string;

  // Chain Items
  chainId?: string | number;

  isCosmosChain?: boolean;
};

export const useAccountBalance = ({
  addressOrDenom,
  chainId,
  isCosmosChain,
}: UseAccountBalanceProps = {}): {
  balance: string | undefined;
  isQueryFetching: boolean;
  nativeStakingBalance: number;
  nativeTokenBalance: BigNumber;
  queryStatus: 'success' | 'error' | 'pending';
  usdcBalance: number;
  refetchQuery: (options?: RefetchOptions) => Promise<QueryObserverResult>;
} => {
  const { dydxAccountGraz } = useWalletConnection();
  const { sourceAccount, dydxAddress } = useAccounts();

  const { chainTokenAmount: nativeTokenCoinBalance, usdcAmount: usdcCoinBalance } = useAppSelector(
    BonsaiCore.account.balances.data
  );

  const { chainTokenDenom, usdcDecimals } = useTokenConfigs();
  const evmChainId = Number(useEnvConfig('ethereumChainId'));
  const stakingBalances = BonsaiHooks.useStakingDelegations().data?.balances;
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { validators } = useEndpointsConfig();

  const evmAddress =
    sourceAccount.chain === WalletNetworkType.Evm
      ? (sourceAccount.address as EvmAddress)
      : undefined;

  const isEVMnativeToken = isNativeDenom(addressOrDenom);

  const evmNative = useBalance({
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    query: {
      enabled: Boolean(evmAddress && isEVMnativeToken),
    },
  });

  const tokenContract = {
    address: addressOrDenom as EvmAddress,
    abi: erc20Abi,
  } as const;

  const evmToken = useReadContracts({
    contracts: [
      {
        ...tokenContract,
        functionName: 'balanceOf',
        args: [evmAddress ?? '0x'],
        chainId: typeof chainId === 'number' ? chainId : undefined,
      } as const,
      {
        ...tokenContract,
        functionName: 'decimals',
        chainId: typeof chainId === 'number' ? chainId : undefined,
      } as const,
    ],
    query: {
      enabled: Boolean(
        evmAddress && !isCosmosChain && addressOrDenom?.startsWith('0x') && !isEVMnativeToken
      ),
    },
  });

  const cosmosAddress = useMemo(() => {
    if (chainId === selectedDydxChainId) {
      return dydxAddress;
    }
    if (typeof chainId === 'string' && SUPPORTED_COSMOS_CHAINS.includes(chainId)) {
      return dydxAccountGraz?.[chainId]?.bech32Address;
    }
    return undefined;
  }, [chainId, dydxAccountGraz, dydxAddress, selectedDydxChainId]);

  const cosmosQueryFn = useCallback(async () => {
    if (dydxAddress && cosmosAddress && addressOrDenom) {
      const rpc = (() => {
        if (chainId === selectedDydxChainId) {
          return validators[0];
        }
        return undefined;
      })();

      if (!rpc) return undefined;

      const client = await (await getLazyStargateClient()).connect(rpc);
      const balanceAsCoin = await client.getBalance(cosmosAddress, addressOrDenom);
      await client.disconnect();

      return formatUnits(BigInt(balanceAsCoin.amount), usdcDecimals);
    }
    return undefined;
  }, [
    dydxAddress,
    cosmosAddress,
    addressOrDenom,
    usdcDecimals,
    chainId,
    selectedDydxChainId,
    validators,
  ]);

  const cosmosQuery = useQuery({
    enabled: Boolean(isCosmosChain && dydxAddress && cosmosAddress && addressOrDenom),
    queryKey: ['accountBalances', chainId, cosmosAddress, addressOrDenom],
    queryFn: cosmosQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const { value: evmNativeBalance, decimals: evmNativeDecimals } = evmNative.data ?? {};
  const [evmTokenBalance, evmTokenDecimals] = evmToken.data ?? [];

  const evmBalance = isEVMnativeToken
    ? evmNativeBalance !== undefined && evmNativeDecimals !== undefined
      ? formatUnits(evmNativeBalance, evmNativeDecimals)
      : undefined
    : evmTokenBalance?.result !== undefined && evmTokenDecimals?.result !== undefined
      ? formatUnits(evmTokenBalance.result, evmTokenDecimals.result)
      : undefined;

  const balance = evmBalance;

  const nativeTokenBalance = MustBigNumber(nativeTokenCoinBalance);
  const usdcBalance = MustBigNumber(usdcCoinBalance).toNumber();

  const nativeStakingCoinBalanace = stakingBalances?.[chainTokenDenom];
  const nativeStakingBalance = MustBigNumber(nativeStakingCoinBalanace?.amount).toNumber();

  let queryStatus = evmNative.status;
  let isQueryFetching = evmNative.isFetching;
  if (isCosmosChain) {
    queryStatus = cosmosQuery.status;
    isQueryFetching = cosmosQuery.isFetching;
  }

  return {
    balance: balance?.toString(),
    nativeTokenBalance,
    nativeStakingBalance,
    usdcBalance,
    queryStatus,
    isQueryFetching,
    refetchQuery: evmNative.refetch,
  };
};
