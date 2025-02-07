import { useCallback, useMemo } from 'react';

import { BonsaiCore, BonsaiHooks } from '@/bonsai/ontology';
import { StargateClient } from '@cosmjs/stargate';
import { PublicKey } from '@solana/web3.js';
import { QueryObserverResult, RefetchOptions, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { erc20Abi, formatUnits } from 'viem';
import { useBalance, useReadContracts } from 'wagmi';

import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  SUPPORTED_COSMOS_CHAINS,
} from '@/constants/graz';
import { COSMOS_GAS_RESERVE } from '@/constants/numbers';
import { EvmAddress, SolAddress, WalletNetworkType } from '@/constants/wallets';

import { useSolanaConnection } from '@/hooks/useSolanaConnection';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isNativeDenom } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';

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
  const { sourceAccount, dydxAccountGraz, dydxAddress } = useAccounts();

  const { chainTokenAmount: nativeTokenCoinBalance, usdcAmount: usdcCoinBalance } = useAppSelector(
    BonsaiCore.account.balances.data
  );

  const { chainTokenDenom, usdcDecimals } = useTokenConfigs();
  const evmChainId = Number(useEnvConfig('ethereumChainId'));
  const stakingBalances = BonsaiHooks.useStakingDelegations().data?.balances;
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { nobleValidator, osmosisValidator, neutronValidator, validators } = useEndpointsConfig();
  const isSolanaChain = sourceAccount.chain === WalletNetworkType.Solana;

  const evmAddress =
    sourceAccount.chain === WalletNetworkType.Evm
      ? (sourceAccount.address as EvmAddress)
      : undefined;
  const solAddress = isSolanaChain ? (sourceAccount.address as SolAddress) : undefined;

  const isEVMnativeToken = isNativeDenom(addressOrDenom);

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

  const connection = useSolanaConnection();
  const solanaQueryFn = useCallback(async (): Promise<{ data: { formatted: string } }> => {
    try {
      const address = solAddress;
      const token = addressOrDenom;
      if (!address || !token) {
        throw new Error('Account or token address is not present');
      }
      const owner = new PublicKey(address);
      const mint = new PublicKey(token);
      const response = await connection.getParsedTokenAccountsByOwner(owner, { mint });

      // An array of all of the owner's associated token accounts for the `mint`.
      const accounts = response.value;

      // The owner has no associated token accounts open for the
      // specified token mint, and therefore, their balance is zero.
      if (accounts.length === 0)
        return {
          data: {
            formatted: '0',
          },
        };

      // Select the associated token account owned by the user with the highest amount
      const largestAccount = accounts.reduce((largest, current) => {
        const currentBalance = current.account.data.parsed.info.tokenAmount.uiAmount;
        const largestBalance = largest.account.data.parsed.info.tokenAmount.uiAmount;
        return currentBalance >= largestBalance ? current : largest;
      }, accounts[0]!);

      return {
        data: {
          formatted: largestAccount.account.data.parsed.info.tokenAmount.uiAmountString as string,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch Solana balance: ${error.message}`);
    }
  }, [solAddress, addressOrDenom, connection]);

  const solanaQuery = useQuery({
    enabled: Boolean(isSolanaChain && dydxAddress && solAddress && addressOrDenom),
    queryKey: ['accountBalancesSol', chainId, solAddress, addressOrDenom],
    queryFn: solanaQueryFn,
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

  // remove fee from usdc cosmos balance
  const cosmosBalance = cosmosQuery.data
    ? Math.max(parseFloat(cosmosQuery.data) - COSMOS_GAS_RESERVE, 0)
    : undefined;

  const solBalance = solanaQuery.data?.data.formatted;

  const balance = isCosmosChain ? cosmosBalance : isSolanaChain ? solBalance : evmBalance;

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
  if (isSolanaChain) {
    queryStatus = solanaQuery.status;
    isQueryFetching = solanaQuery.isFetching;
  }

  return {
    balance: balance?.toString(),
    nativeTokenBalance,
    nativeStakingBalance,
    usdcBalance,
    queryStatus,
    isQueryFetching,
    refetchQuery: isCosmosChain
      ? cosmosQuery.refetch
      : isSolanaChain
        ? solanaQuery.refetch
        : evmNative.refetch,
  };
};
