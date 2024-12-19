import { useMemo } from 'react';

import { BalanceRequest } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { Chain } from 'viem';
import { optimism } from 'viem/chains';

import { EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { CosmosChainId } from '@/constants/graz';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { timeUnits } from '@/constants/time';
import { USDC_ADDRESSES } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';

import { SourceAccount } from '@/state/wallet';

export function useBalances() {
  const { sourceAccount } = useAccounts();
  const { skipClient } = useSkipClient();

  return useQuery({
    queryKey: ['balances', sourceAccount.address],
    queryFn: async () => {
      return skipClient.balances(networkTypeToBalances(sourceAccount));
    },
    enabled: Boolean(sourceAccount.address),
    staleTime: 5 * timeUnits.minute,
    refetchOnMount: 'always',
  });
}

export function useBalance(
  chainId: string,
  tokenDenom: string
): { formatted?: string; raw?: string } {
  const { data: allBalances } = useBalances();

  return useMemo(() => {
    const balance = allBalances?.chains[chainId]?.denoms[tokenDenom];

    if (!balance?.decimals) return { formatted: undefined, raw: undefined };

    return {
      formatted: balance.formattedAmount,
      raw: balance.amount,
    };
  }, [allBalances?.chains, chainId, tokenDenom]);
}

function getNativeEvmTokenDenom(chain: Chain) {
  if (chain.id === optimism.id) {
    return 'optimism-native';
  }

  return `${chain.name.toLowerCase()}-native`;
}

function networkTypeToBalances(sourceAccount: SourceAccount): BalanceRequest {
  if (!sourceAccount.address) {
    throw new Error('fetching balances for undefined address');
  }

  if (sourceAccount.chain === WalletNetworkType.Evm) {
    const chainRequest = EVM_DEPOSIT_CHAINS.reduce(
      (acc, curr) => {
        acc[curr.id.toString()] = {
          address: sourceAccount.address!,
          denoms: [getNativeEvmTokenDenom(curr), USDC_ADDRESSES[curr.id]],
        };
        return acc;
      },
      {} as BalanceRequest['chains']
    );
    return { chains: chainRequest };
  }

  if (sourceAccount.chain === WalletNetworkType.Solana) {
    return {
      chains: {
        [SOLANA_MAINNET_ID]: {
          address: sourceAccount.address!,
          denoms: [USDC_ADDRESSES[SOLANA_MAINNET_ID]],
        },
      },
    };
  }

  if (sourceAccount.chain === WalletNetworkType.Cosmos) {
    return {
      chains: {
        [CosmosChainId.Neutron]: {
          address: sourceAccount.address!,
          denoms: [USDC_ADDRESSES[CosmosChainId.Neutron]],
        },
        [CosmosChainId.Osmosis]: {
          address: sourceAccount.address!,
          denoms: [USDC_ADDRESSES[CosmosChainId.Osmosis]],
        },
        [CosmosChainId.Noble]: {
          address: sourceAccount.address!,
          denoms: [USDC_ADDRESSES[CosmosChainId.Noble]],
        },
      },
    };
  }

  throw new Error('Fetching balances for unknown chain');
}
