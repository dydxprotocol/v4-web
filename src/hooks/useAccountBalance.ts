import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useBalance } from 'wagmi';
import { StargateClient } from '@cosmjs/stargate';
import { useQuery } from 'react-query';
import { formatUnits } from 'viem';

import { CLIENT_NETWORK_CONFIGS, type DydxV4Network } from '@/constants/networks';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { EthereumAddress } from '@/constants/wallets';

import { convertBech32Address } from '@/lib/addressUtils';
import { MustBigNumber } from '@/lib/numbers';

import { getSelectedNetwork } from '@/state/appSelectors';

import { useAccounts } from './useAccounts';
// import { useDydxClient } from './useDydxClient';
import { usePollNativeTokenBalance } from './usePollNativeTokenBalance';

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
const CHAIN_DEFAULT_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const useAccountBalance = ({
  addressOrDenom = CHAIN_DEFAULT_TOKEN_ADDRESS,
  assetSymbol,
  bech32AddrPrefix,
  chainId,
  decimals = 0,
  rpc,
  isCosmosChain,
}: UseAccountBalanceProps = {}) => {
  const { evmAddress, dydxAddress } = useAccounts();

  // TODO: let Abacus / useDydxClient handle EVM chain IDs
  // const { networkConfig } = useDydxClient();
  const selectedNetwork = useSelector(getSelectedNetwork);
  const evmChainId = Number(CLIENT_NETWORK_CONFIGS[selectedNetwork as DydxV4Network].ethereumChainId);

  const evmQuery = useBalance({
    enabled: Boolean(!isCosmosChain && addressOrDenom?.startsWith('0x')),
    address: evmAddress,
    chainId: typeof chainId === 'number' ? chainId : Number(evmChainId),
    token:
      addressOrDenom === CHAIN_DEFAULT_TOKEN_ADDRESS
        ? undefined
        : (addressOrDenom as EthereumAddress),
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

  const nativeTokenCoinBalance = usePollNativeTokenBalance({ dydxAddress });
  const nativeTokenBalance = MustBigNumber(nativeTokenCoinBalance?.amount)
    .div(QUANTUM_MULTIPLIER)
    .toNumber();

  return {
    balance,
    nativeTokenBalance,
    queryStatus: isCosmosChain ? cosmosQuery.status : evmQuery.status,
    isQueryFetching: isCosmosChain ? cosmosQuery.isFetching : evmQuery.fetchStatus === 'fetching',
  };
};
