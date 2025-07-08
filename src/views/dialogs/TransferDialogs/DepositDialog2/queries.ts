import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { BalanceRequest, RouteRequest, RouteResponse } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { Chain, parseUnits } from 'viem';
import { arbitrum, optimism } from 'viem/chains';

import { DYDX_DEPOSIT_CHAIN, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { CosmosChainId } from '@/constants/graz';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { timeUnits } from '@/constants/time';
import { DYDX_CHAIN_USDC_DENOM, TokenForTransfer, USDC_ADDRESSES } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { SkipClient, useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

import { SourceAccount } from '@/state/wallet';

export function useBalances() {
  const { sourceAccount, nobleAddress, osmosisAddress, neutronAddress } = useAccounts();
  const { skipClient } = useSkipClient();

  return useQuery({
    queryKey: ['balances', sourceAccount.address, nobleAddress, osmosisAddress, neutronAddress],
    queryFn: async () => {
      return skipClient.balances(
        networkTypeToBalances(sourceAccount, nobleAddress, osmosisAddress, neutronAddress)
      );
    },
    enabled: Boolean(sourceAccount.address && nobleAddress && osmosisAddress && neutronAddress),
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
    const balance = allBalances?.chains?.[chainId]?.denoms?.[tokenDenom];

    if (!balance?.decimals) return { formatted: undefined, raw: undefined };

    return {
      formatted: balance.formattedAmount,
      raw: balance.amount,
    };
  }, [allBalances?.chains, chainId, tokenDenom]);
}

function getNativeEvmTokenDenom(chain: Chain) {
  // special case: chain name is OP Mainnet
  if (chain.id === optimism.id) {
    return 'optimism-native';
  }

  // special case: chain name is Arbitrum One
  if (chain.id === arbitrum.id) {
    return 'arbitrum-native';
  }

  return `${chain.name.toLowerCase()}-native`;
}

function networkTypeToBalances(
  sourceAccount: SourceAccount,
  nobleAddress?: string,
  osmosisAddress?: string,
  neutronAddress?: string
): BalanceRequest {
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
      {} as Required<BalanceRequest>['chains']
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
    if (!neutronAddress || !osmosisAddress || !nobleAddress) {
      throw new Error('cosmos addresses not defined');
    }

    return {
      chains: {
        [CosmosChainId.Neutron]: {
          address: neutronAddress,
          denoms: [USDC_ADDRESSES[CosmosChainId.Neutron]],
        },
        [CosmosChainId.Osmosis]: {
          address: osmosisAddress,
          denoms: [USDC_ADDRESSES[CosmosChainId.Osmosis]],
        },
        [CosmosChainId.Noble]: {
          address: nobleAddress,
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
    sourceAssetChainId: token.chainId,
    destAssetDenom: DYDX_CHAIN_USDC_DENOM,
    destAssetChainId: DYDX_DEPOSIT_CHAIN,
    amountIn: parseUnits(amount, token.decimals).toString(),
    smartRelay: true,
    // TODO(deposit2.0): Manually calculate price impact by comparing USD values and warn user if difference > a certain %
    allowUnsafe: true,
    smartSwapOptions: { evmSwaps: true },
  };

  const [slow, fast] = await Promise.all([
    skipClient.route(routeOptions),
    skipClient.route({ ...routeOptions, goFast: true }),
  ]);

  return { slow, fast: fast != null && isInstantDeposit(fast) ? fast : undefined };
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
    retry: false,
  });
}

export function isInstantDeposit(route: RouteResponse) {
  // @ts-ignore SDK doesn't know about .goFastTransfer
  return Boolean(route.operations.find((op) => op.goFastTransfer));
}

export function useDepositDeltas({ depositAmount }: { depositAmount?: string }) {
  const depositInput = useMemo(
    () => ({
      subaccountNumber: 0,
      amount: depositAmount ?? '',
    }),
    [depositAmount]
  );

  const modifiedParentSubaccount = useAppSelectorWithArgs(
    BonsaiHelpers.forms.deposit.selectParentSubaccountSummary,
    depositInput
  );

  return modifiedParentSubaccount;
}
