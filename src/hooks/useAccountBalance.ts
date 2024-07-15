import { useCallback, useMemo } from 'react';

import { StargateClient } from '@cosmjs/stargate';
import { useQuery } from '@tanstack/react-query';
import { useAccount as useAccountGraz } from 'graz';
import { shallowEqual } from 'react-redux';
import { erc20Abi, formatUnits } from 'viem';
import { useBalance, useReadContracts } from 'wagmi';

import { EvmAddress } from '@/constants/wallets';

import { getBalances, getStakingBalances } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { SUPPORTED_COSMOS_CHAINS } from '@/lib/graz';
import { MustBigNumber } from '@/lib/numbers';
import { getNobleChainId, getOsmosisChainId } from '@/lib/squid';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';
import { useEnvConfig } from './useEnvConfig';
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
}: UseAccountBalanceProps = {}) => {
  const { evmAddress, dydxAddress } = useAccounts();

  const balances = useAppSelector(getBalances, shallowEqual);
  const { chainTokenDenom, usdcDenom, usdcDecimals } = useTokenConfigs();
  const evmChainId = Number(useEnvConfig('ethereumChainId'));
  const stakingBalances = useAppSelector(getStakingBalances, shallowEqual);
  const { nobleValidator, osmosisValidator } = useEndpointsConfig();

  const isEVMnativeToken = addressOrDenom === CHAIN_DEFAULT_TOKEN_ADDRESS;

  const evmNative = useBalance({
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    query: {
      enabled: Boolean(!isCosmosChain && isEVMnativeToken),
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

  const { data: accounts } = useAccountGraz({
    chainId: SUPPORTED_COSMOS_CHAINS,
    multiChain: true,
  });

  const cosmosAddress = useMemo(() => {
    const nobleChainId = getNobleChainId();
    const osmosisChainId = getOsmosisChainId();
    if (chainId === osmosisChainId) {
      return accounts?.[osmosisChainId]?.bech32Address;
    }
    if (chainId === nobleChainId) {
      return accounts?.[nobleChainId]?.bech32Address;
    }
    return undefined;
  }, [accounts, chainId]);

  const cosmosQueryFn = useCallback(async () => {
    if (dydxAddress && cosmosAddress && addressOrDenom) {
      const nobleChainId = getNobleChainId();
      const osmosisChainId = getOsmosisChainId();
      const rpc = (() => {
        if (chainId === nobleChainId) {
          return nobleValidator;
        }
        if (chainId === osmosisChainId) {
          return osmosisValidator;
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
    nobleValidator,
    osmosisValidator,
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
