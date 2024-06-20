import { useBalance as useBalanceGraz } from 'graz';
import { shallowEqual } from 'react-redux';
import { formatUnits } from 'viem';
import { useBalance as useBalanceWagmi } from 'wagmi';

import { EvmAddress } from '@/constants/wallets';

import { getBalances, getStakingBalances } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';
import { getNobleChainId } from '@/lib/squid';

import { useAccounts } from './useAccounts';
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
  const { evmAddress, nobleAddress } = useAccounts();

  const balances = useAppSelector(getBalances, shallowEqual);
  const { chainTokenDenom, usdcDenom, usdcGasDenom, usdcDecimals } = useTokenConfigs();
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

  const cosmosQuery = useBalanceGraz({
    chainId: getNobleChainId(),
    bech32Address: nobleAddress,
    denom: usdcGasDenom,
    enabled: Boolean(isCosmosChain),
  });

  const { formatted: evmBalance } = evmQuery.data ?? {};
  const { amount: cosmosBalance } = cosmosQuery.data ?? {};
  const balance = isCosmosChain
    ? formatUnits(BigInt(cosmosBalance ?? 0), usdcDecimals)
    : evmBalance;

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
    isQueryFetching: isCosmosChain ? cosmosQuery.isFetching : evmQuery.isFetching,
  };
};
