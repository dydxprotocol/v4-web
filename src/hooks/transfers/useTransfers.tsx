import { useMemo, useState } from 'react';

import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { Chain, MsgsDirectRequest } from '@skip-go/client';
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
  COSMOS_SWAP_VENUES,
  getDefaultChainIDFromNetworkType,
  getDefaultTokenDenomFromAssets,
  getNetworkTypeFromWalletInfo,
  SWAP_VENUES,
  TransferType,
} from '@/constants/transfers';
import { DydxAddress, EvmAddress, SolAddress } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { convertBech32Address } from '@/lib/addressUtils';
import { isNativeDenom } from '@/lib/assetUtils';

import { useAccounts } from '../useAccounts';
import { useSkipClient } from './skipClient';

export const useTransfers = () => {
  const { skipClient } = useSkipClient();
  const { dydxAddress, sourceAccount } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const [fromTokenDenom, setFromTokenDenom] = useState<string | null>(null);
  const [fromChainId, setFromChainId] = useState<string | null>(null);
  const [toTokenDenom, setToTokenDenom] = useState<string | null>(null);
  const [toChainId, setToChainId] = useState<string | null>(null);
  const [fromAddress, setFromAddress] = useState<EvmAddress | SolAddress | DydxAddress | undefined>(
    undefined
  );
  const [toAddress, setToAddress] = useState<EvmAddress | SolAddress | DydxAddress | undefined>(
    undefined
  );
  const [transferType, setTransferType] = useState<TransferType>(TransferType.Withdraw);
  const [amount, setAmount] = useState<string>('');

  const chainsQuery = useQuery({
    queryKey: ['transferEligibleChains'],
    queryFn: async () => {
      const skipSupportedChains = await skipClient.chains({
        includeEVM: true,
        includeSVM: true,
      });
      const chainsByNetworkMap = skipSupportedChains.reduce<Record<string, Chain[]>>(
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
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const assetsQuery = useQuery({
    queryKey: ['transferEligibleAssets'],
    queryFn: async () => {
      const assetsByChain = await skipClient.assets({
        includeEvmAssets: true,
        includeSvmAssets: true,
      });
      return { assetsByChain };
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const { chainsByNetworkMap = {} } = chainsQuery.data ?? {};
  const { assetsByChain = {} } = assetsQuery.data ?? {};

  const walletNetworkType = getNetworkTypeFromWalletInfo(sourceAccount?.walletInfo);
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
    !!amount &&
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
      amount,
      dydxAddress,
      selectedDydxChainId,
    ],
    queryFn: async () => {
      // this should never happen, this is just to satisfy typescript
      // react queries should never return null.
      if (!hasAllParams) return null;

      const baseParams = {
        sourceAssetDenom: fromToken.denom,
        sourceAssetChainID: fromToken.chainID,
        destAssetDenom: toToken.denom,
        destAssetChainID: toToken.chainID,
        allowUnsafe: true,
        slippageTolerancePercent: '1',
        smartRelay: true,
        amountIn: parseUnits(amount, fromToken.decimals ?? 0).toString(),
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
        if (isTokenCctp(toToken)) {
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
        // Non cctp withdrawals
        return skipClient.msgsDirect({
          ...baseParams,
          chainIdsToAddresses: {
            [selectedDydxChainId]: dydxAddress,
            [toToken.chainID]: toAddress,
            ...cosmosChainAddresses,
          },
          bridges: ['IBC', 'AXELAR'],
          swapVenues: COSMOS_SWAP_VENUES,
        });
      }

      // DEPOSITS
      // This should never happen. Consider moving to a useMemo hook
      // and setting as part of allParams + query keys

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
    enabled: hasAllParams,
  });

  const route = routeQuery?.data;

  // TODO: maybe abstract away the adding of transfer notifications to this hook instead of having
  // withdrawal and deposit modals handle them separately in multiple places
  // const { addOrUpdateTransferNotification } = useLocalNotifications();

  return {
    // TODO: Think about trimming this list
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
    defaultChainId,
    defaultTokenDenom,
    toToken,
    fromToken,
  };
};
