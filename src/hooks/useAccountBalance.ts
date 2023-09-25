import { useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useBalance } from 'wagmi';
import { StargateClient } from '@cosmjs/stargate';
import { useQuery } from 'react-query';
import { formatUnits } from 'viem';

import { USDC_DENOM, DYDX_DENOM } from '@dydxprotocol/v4-client-js';

import { CLIENT_NETWORK_CONFIGS } from '@/constants/networks';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { EvmAddress } from '@/constants/wallets';

import { convertBech32Address } from '@/lib/addressUtils';
import { MustBigNumber } from '@/lib/numbers';

import { getBalances } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';

import { useAccounts } from './useAccounts';

type UseAccountBalanceProps = {
  // Token Items
  addressOrDenom?: string;
  assetSymbol?: string;
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
  assetSymbol,
  bech32AddrPrefix,
  chainId,
  decimals = 0,
  rpc,
  isCosmosChain,
}: UseAccountBalanceProps = {}) => {
  const { evmAddress, dydxAddress } = useAccounts();

  const selectedNetwork = useSelector(getSelectedNetwork);
  const balances = useSelector(getBalances, shallowEqual);
  const evmChainId = Number(CLIENT_NETWORK_CONFIGS[selectedNetwork].ethereumChainId);

  const evmQuery = useBalance({
    enabled: Boolean(!isCosmosChain && addressOrDenom?.startsWith('0x')),
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    token:
      addressOrDenom === CHAIN_DEFAULT_TOKEN_ADDRESS
        ? undefined
        : (addressOrDenom as EvmAddress),
    watch: true,
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
  }, [addressOrDenom, chainId, rpc]);

  const cosmosQuery = useQuery({
    enabled: Boolean(isCosmosChain && dydxAddress && bech32AddrPrefix && rpc && addressOrDenom),
    queryKey: `accountBalances_${chainId}_${addressOrDenom}`,
    queryFn: cosmosQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const { formatted: evmBalance } = evmQuery.data || {};
  const balance = !assetSymbol ? '0' : isCosmosChain ? cosmosQuery.data : evmBalance;

  const nativeTokenCoinBalance = balances?.[DYDX_DENOM];
  const nativeTokenBalance = MustBigNumber(nativeTokenCoinBalance?.amount)
    .div(QUANTUM_MULTIPLIER)
    .toNumber();
  
  const usdcCoinBalance = balances?.[USDC_DENOM];
  const usdcBalance = MustBigNumber(usdcCoinBalance?.amount).div(QUANTUM_MULTIPLIER).toNumber();

  return {
    balance,
    nativeTokenBalance,
    usdcBalance,
    queryStatus: isCosmosChain ? cosmosQuery.status : evmQuery.status,
    isQueryFetching: isCosmosChain ? cosmosQuery.isFetching : evmQuery.fetchStatus === 'fetching',
  };
};
