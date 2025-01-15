import { useMemo } from 'react';

import { BonsaiHelpers } from '@/abacus-ts/ontology';
import { BalanceRequest, RouteRequest, SkipClient } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { Chain, parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { DYDX_DEPOSIT_CHAIN, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { CosmosChainId } from '@/constants/graz';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { timeUnits } from '@/constants/time';
import { DYDX_CHAIN_USDC_DENOM, TokenForTransfer, USDC_ADDRESSES } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';

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

async function getSkipDepositRoutes(
  skipClient: SkipClient,
  token: TokenForTransfer,
  amount: string
) {
  const routeOptions: RouteRequest = {
    sourceAssetDenom: token.denom,
    sourceAssetChainID: token.chainId,
    destAssetDenom: DYDX_CHAIN_USDC_DENOM,
    destAssetChainID: DYDX_DEPOSIT_CHAIN,
    amountIn: parseUnits(amount, token.decimals).toString(),
    smartRelay: true,
    smartSwapOptions: { evmSwaps: true },
  };

  const [slow, fast] = await Promise.all([
    skipClient.route(routeOptions),
    skipClient.route({ ...routeOptions, goFast: true }),
  ]);

  // @ts-ignore SDK doesn't know about .goFastTransfer
  const isFastRouteAvailable = Boolean(fast.operations.find((op) => op.goFastTransfer));
  return { slow, fast: isFastRouteAvailable ? fast : undefined };
}

export function useDepositRoutes(token: TokenForTransfer, amount: string) {
  const { skipClient } = useSkipClient();
  const rawAmount = amount && parseUnits(amount, token.decimals);
  return useQuery({
    queryKey: ['routes', token.chainId, token.denom, amount],
    queryFn: () => getSkipDepositRoutes(skipClient, token, amount),
    enabled: Boolean(rawAmount && rawAmount > 0),
    staleTime: 1 * timeUnits.minute,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });
}

export function useDepositDeltas({ depositAmount }: { depositAmount: string }) {
  const depositInput = useMemo(
    () => ({
      subaccountNumber: 0,
      depositAmount,
    }),
    [depositAmount]
  );

  const modifiedParentSubaccount = useParameterizedSelector(
    BonsaiHelpers.forms.deposit.createSelectParentSubaccountSummary,
    depositInput
  );

  return modifiedParentSubaccount;
}
