import { useMemo, useState } from 'react';

import { SkipClient } from '@skip-go/client';
import { Chain } from 'viem';

import { TransferType } from '@/constants/transfers';
import { DydxAddress, EvmAddress, SolAddress } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

import { useAccounts } from '../useAccounts';
import { useDebounce } from '../useDebounce';
import { useTokenConfigs } from '../useTokenConfigs';
import { useSkipClient } from './skipClient';

const ROUTE_QUERY_REFETCH_INTERVAL = 5_000;

export const chainsQueryFn = async (skipClient: SkipClient) => {
  const skipSupportedChains = await skipClient.chains({
    includeEVM: true,
    includeSVM: true,
  });
  const chainsByNetworkMap = skipSupportedChains.reduce<{ [key: string]: Chain[] }>(
    (chainsMap, nextChain) => {
      const chainsListForNetworkType = chainsMap[nextChain.chainType] ?? [];
      chainsMap[nextChain.chainType] = [...chainsListForNetworkType, nextChain];
      return chainsMap;
    },
    {}
  );
  return {
    skipSupportedChains,
    chainsByNetworkMap,
  };
};

export const assetsQueryFn = async (skipClient: SkipClient) => {
  const assetsByChain = await skipClient.assets({
    includeEvmAssets: true,
    includeSvmAssets: true,
  });
  return { assetsByChain };
};

export const useDepositResources = () => {
  const { skipClient, skipClientId } = useSkipClient();
  const { dydxAddress, sourceAccount } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { usdcDenom } = useTokenConfigs();

  const [fromTokenDenom, setFromTokenDenom] = useState<string | undefined>();
  const [fromChainId, setFromChainId] = useState<string | undefined>();
  const toChainId = selectedDydxChainId;
  const toTokenDenom = usdcDenom;
  const [fromAddress, setFromAddress] = useState<EvmAddress | SolAddress | DydxAddress | undefined>(
    undefined
  );
  const [toAddress, setToAddress] = useState<EvmAddress | SolAddress | DydxAddress | undefined>(
    undefined
  );
  const [transferType, setTransferType] = useState<TransferType>(TransferType.Withdraw);
  const [amount, setAmount] = useState<string>('');

  const debouncedAmount = useDebounce(amount, 500);
  const debouncedAmountBN = useMemo(() => MustBigNumber(debouncedAmount), [debouncedAmount]);

  const chainsQuery = useQuery({
    queryKey: ['transferEligibleChains', skipClientId],
    queryFn: () => chainsQueryFn(skipClient),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const assetsQuery = useQuery({
    queryKey: ['transferEligibleAssets', skipClientId],
    queryFn: () => assetsQueryFn(skipClient),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const { chainsByNetworkMap = {} } = chainsQuery.data ?? {};
  const { assetsByChain = {} } = assetsQuery.data ?? {};
};
