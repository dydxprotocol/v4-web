import { useCallback, useMemo } from 'react';

import { StargateClient } from '@cosmjs/stargate';
import { QueryObserverResult, RefetchOptions, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';
import { erc20Abi, formatUnits } from 'viem';
import { useBalance, useReadContracts } from 'wagmi';

import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  SUPPORTED_COSMOS_CHAINS,
} from '@/constants/graz';
import { COSMOS_GAS_RESERVE } from '@/constants/numbers';
import { EvmAddress } from '@/constants/wallets';

import { getBalances, getStakingBalances } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';
import { useEnvConfig } from './useEnvConfig';
import { useSolanaTokenBalance } from './useSolanaBalance';
import { useTokenConfigs } from './useTokenConfigs';

type UseAccountBalanceProps = {
  // Token Items
  addressOrDenom?: string;

  // Chain Items
  chainId?: string | number;

  isCosmosChain?: boolean;
};

/**
 * 0xSquid uses this 0x address as the chain's default token.
 * @todo We will need to add additional logic here if we 'useAccountBalance' on non-Squid related forms.
 */
export const CHAIN_DEFAULT_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

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
  const { evmAddress, dydxAddress, dydxAccountGraz, solAddress } = useAccounts();

  const balances = useAppSelector(getBalances, shallowEqual);
  const { chainTokenDenom, usdcDenom, usdcDecimals } = useTokenConfigs();
  const evmChainId = Number(useEnvConfig('ethereumChainId'));
  const stakingBalances = useAppSelector(getStakingBalances, shallowEqual);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { nobleValidator, osmosisValidator, neutronValidator, validators } = useEndpointsConfig();
  const isSolanaChain = !!solAddress;

  const isEVMnativeToken = addressOrDenom === CHAIN_DEFAULT_TOKEN_ADDRESS;

  const evmNative = useBalance({
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    query: {
      enabled: Boolean(!isCosmosChain && !isSolanaChain && isEVMnativeToken),
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

  const solanaToken = useSolanaTokenBalance({ address: solAddress, token: addressOrDenom });

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
      const nobleChainId = getNobleChainId();
      const osmosisChainId = getOsmosisChainId();
      const neutronChainId = getNeutronChainId();
      const rpc = (() => {
        if (chainId === nobleChainId) {
          return nobleValidator;
        }
        if (chainId === osmosisChainId) {
          return osmosisValidator;
        }
        if (chainId === neutronChainId) {
          return neutronValidator;
        }
        if (chainId === selectedDydxChainId) {
          return validators[0];
        }
        return undefined;
      })();

      if (!rpc) return undefined;

      const client = await StargateClient.connect(rpc);
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
    nobleValidator,
    osmosisValidator,
    neutronValidator,
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
      ? formatUnits(evmTokenBalance?.result, evmTokenDecimals?.result)
      : undefined;

  const cosmosBalance = cosmosQuery.data
    ? parseFloat(cosmosQuery.data) - COSMOS_GAS_RESERVE
    : undefined;

  const solBalance = solanaToken?.data?.data.formatted;

  const balance = isCosmosChain ? cosmosBalance : isSolanaChain ? solBalance : evmBalance;

  const nativeTokenCoinBalance = balances?.[chainTokenDenom];
  const nativeTokenBalance = MustBigNumber(nativeTokenCoinBalance?.amount);

  const usdcCoinBalance = balances?.[usdcDenom];
  const usdcBalance = MustBigNumber(usdcCoinBalance?.amount).toNumber();

  const nativeStakingCoinBalanace = stakingBalances?.[chainTokenDenom];
  const nativeStakingBalance = MustBigNumber(nativeStakingCoinBalanace?.amount).toNumber();

  let queryStatus = evmNative.status;
  let isQueryFetching = evmNative.isFetching;
  if (isCosmosChain) {
    queryStatus = cosmosQuery.status;
    isQueryFetching = cosmosQuery.isFetching;
  }
  if (isSolanaChain) {
    queryStatus = solanaToken.status;
    isQueryFetching = solanaToken.isFetching;
  }

  return {
    balance,
    nativeTokenBalance,
    nativeStakingBalance,
    usdcBalance,
    queryStatus,
    isQueryFetching,
    refetchQuery: isCosmosChain ? cosmosQuery.refetch : evmNative.refetch,
  };
};
