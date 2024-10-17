import { useMemo, useState } from 'react';

import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { Chain, MsgsDirectRequest, SkipClient } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { parseUnits } from 'viem';

import { isTokenCctp } from '@/constants/cctp';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  NEUTRON_BECH32_PREFIX,
  OSMO_BECH32_PREFIX,
} from '@/constants/graz';
import {
  getDefaultChainIDFromNetworkType,
  getDefaultTokenDenomFromAssets,
  getNetworkTypeFromWalletNetworkType,
  SWAP_VENUES,
  TransferType,
} from '@/constants/transfers';
import { DydxAddress, EvmAddress, SolAddress } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { convertBech32Address } from '@/lib/addressUtils';
import { isNativeDenom } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';

import { useAccounts } from '../useAccounts';
import { useDebounce } from '../useDebounce';
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

export const useTransfers = () => {
  const { skipClient, skipClientId } = useSkipClient();
  const { dydxAddress, sourceAccount } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const [fromTokenDenom, setFromTokenDenom] = useState<string | undefined>();
  const [fromChainId, setFromChainId] = useState<string | undefined>();
  const [toTokenDenom, setToTokenDenom] = useState<string | undefined>();
  const [toChainId, setToChainId] = useState<string | undefined>();
  // TODO [onboarding-rewrite]: add nobleAddress type when enabling coinbase withdrawals
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

  const walletNetworkType = getNetworkTypeFromWalletNetworkType(sourceAccount?.chain);
  const selectedChainId = transferType === TransferType.Deposit ? fromChainId : toChainId;

  const toToken = useMemo(() => {
    return assetsByChain[toChainId ?? '']?.find((token) => token.denom === toTokenDenom);
  }, [toChainId, toTokenDenom, assetsByChain]);

  const fromToken = useMemo(() => {
    return assetsByChain[fromChainId ?? '']?.find((token) => token.denom === fromTokenDenom);
  }, [fromChainId, fromTokenDenom, assetsByChain]);

  const chainsForNetwork = useMemo(
    () => chainsByNetworkMap?.[walletNetworkType] ?? [],
    [walletNetworkType, chainsByNetworkMap]
  );

  const assetsForSelectedChain = useMemo(() => {
    if (selectedChainId) {
      // sort native denoms to the front of list
      const sortedAssetsForChain = (assetsByChain[selectedChainId] ?? []).sort((a) => {
        return isNativeDenom(a.denom) ? -1 : 1;
      });
      return sortedAssetsForChain;
    }
    return [];
  }, [selectedChainId, assetsByChain]);

  const defaultChainId = useMemo(() => {
    return getDefaultChainIDFromNetworkType(walletNetworkType) ?? chainsForNetwork[0]?.chainID;
  }, [walletNetworkType, chainsForNetwork]);

  const defaultTokenDenom = useMemo(() => {
    return getDefaultTokenDenomFromAssets(assetsForSelectedChain);
  }, [assetsForSelectedChain]);

  const hasAllParams =
    !!fromToken?.denom &&
    !!toToken?.denom &&
    !!fromToken?.decimals &&
    !!toToken?.decimals &&
    !!fromChainId &&
    !!toChainId &&
    !!fromAddress &&
    !!toAddress &&
    !!transferType &&
    !!debouncedAmount &&
    !!dydxAddress;

  const routeQuery = useQuery({
    queryKey: [
      'transferRoute',
      fromToken,
      toToken,
      fromChainId,
      toChainId,
      fromAddress,
      toAddress,
      transferType,
      debouncedAmount,
      dydxAddress,
      selectedDydxChainId,
    ],
    queryFn: async () => {
      // this should never happen, this is just to satisfy typescript
      // react queries should never return null.
      if (!hasAllParams || !fromToken.decimals) return null;

      const baseParams = {
        sourceAssetDenom: fromToken.denom,
        sourceAssetChainID: fromToken.chainID,
        destAssetDenom: toToken.denom,
        destAssetChainID: toToken.chainID,
        allowUnsafe: true,
        slippageTolerancePercent: '1',
        smartRelay: true,
        // TODO [onboarding-rewrite]: talk to skip about this, why are decimals optional? when would that happen?
        amountIn: parseUnits(amount, fromToken.decimals).toString(),
      };

      // consider moving to useMemo outside of this query
      const cosmosChainAddresses = {
        [getOsmosisChainId()]: convertBech32Address({
          address: dydxAddress,
          bech32Prefix: OSMO_BECH32_PREFIX,
        }),
        [getNeutronChainId()]: convertBech32Address({
          address: dydxAddress,
          bech32Prefix: NEUTRON_BECH32_PREFIX,
        }),
        [getNobleChainId()]: convertBech32Address({
          address: dydxAddress,
          bech32Prefix: NOBLE_BECH32_PREFIX,
        }),
      };
      // WITHDRAWALS
      if (transferType === TransferType.Withdraw) {
        return skipClient.msgsDirect({
          ...baseParams,
          chainIdsToAddresses: {
            [selectedDydxChainId]: dydxAddress,
            [toToken.chainID]: toAddress,
          },
          bridges: ['IBC', 'CCTP'],
          allowMultiTx: true,
        });
      }

      // DEPOSITS
      if (isTokenCctp(fromToken)) {
        // CCTP Deposits
        return skipClient.msgsDirect({
          ...(baseParams as MsgsDirectRequest),
          chainIdsToAddresses: {
            [fromToken.chainID]: fromAddress,
            [toToken.chainID]: dydxAddress,
          },
          bridges: ['CCTP', 'IBC'],
        });
      }
      return skipClient.msgsDirect({
        ...(baseParams as MsgsDirectRequest),
        chainIdsToAddresses: {
          [fromToken.chainID]: fromAddress,
          [toToken.chainID]: dydxAddress,
          ...cosmosChainAddresses,
        },
        bridges: ['CCTP', 'IBC', 'AXELAR'],
        smartSwapOptions: { evmSwaps: true },
        swapVenues: SWAP_VENUES,
      });
    },
    refetchInterval: ROUTE_QUERY_REFETCH_INTERVAL,
    enabled: hasAllParams,
  });

  const { route, txs } = routeQuery?.data ?? {};
  return {
    // TODO [onboarding-rewrite]: Think about trimming this list
    // Right now we're exposing everything, but there's a good chance we can only expose a few properties
    // Or, bundle these properties into "depositFormProperties" and "withdrawFormProperties"
    assetsForSelectedChain,
    chainsForNetwork,
    fromTokenDenom,
    setFromTokenDenom,
    fromChainId,
    setFromChainId,
    toTokenDenom,
    setToTokenDenom,
    toChainId,
    setToChainId,
    fromAddress,
    setFromAddress,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    transferType,
    setTransferType,
    route,
    txs,
    defaultChainId,
    defaultTokenDenom,
    toToken,
    fromToken,
    debouncedAmount,
    debouncedAmountBN,
  };
};
