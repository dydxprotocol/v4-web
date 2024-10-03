import { createContext, useContext, useMemo, useState } from 'react';

import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { Chain, MsgsDirectRequest } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { parseUnits } from 'viem';

import { isDenomCctp } from '@/constants/cctp';
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
  getNetworkTypeFromWallet,
  SWAP_VENUES,
  TransferType,
} from '@/constants/transfers';
import { DydxAddress, EvmAddress, SolAddress } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { convertBech32Address } from '@/lib/addressUtils';

import { skipClient } from '../../lib/skip';
import { useAccounts } from '../useAccounts';
import { useLocalNotifications } from '../useLocalNotifications';

type TransfersContextType = ReturnType<typeof useTransfersContext>;
const TransfersContext = createContext<TransfersContextType | undefined>(undefined);
TransfersContext.displayName = 'Transfers';

export const useTransfers = () => {
  const context = useContext(TransfersContext);
  if (!context) {
    throw new Error('useTransfers must be used within an TransfersProvider');
  }
  return context;
};

const chainsQueryFn = async () => {
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
};

const assetsQueryFn = async () => {
  // TODO: sort this! first by native asset, then by lowest fees (so lowest fees is first)
  const assetsByChain = await skipClient.assets({
    includeEvmAssets: true,
    includeSvmAssets: true,
  });
  return { assetsByChain };
};

export const TransfersProvider = ({ ...props }) => {
  return <TransfersContext.Provider value={useTransfersContext()} {...props} />;
};

const useTransfersContext = () => {
  const { dydxAddress, connectedWallet } = useAccounts();
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
    queryFn: chainsQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const assetsQuery = useQuery({
    queryKey: ['transferEligibleAssets'],
    queryFn: assetsQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const { chainsByNetworkMap = {} } = chainsQuery.data ?? {};
  const { assetsByChain = {} } = assetsQuery.data ?? {};

  const walletNetworkType = getNetworkTypeFromWallet(connectedWallet);
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
    if (selectedChainId) return assetsByChain[selectedChainId] ?? [];
    return [];
  }, [selectedChainId, assetsByChain]);

  // maybe just make these consts into a hook that withdraw and deposit can share
  const defaultChainId =
    getDefaultChainIDFromNetworkType(walletNetworkType) ?? chainsForNetwork[0]?.chainID;

  const defaultTokenDenom = getDefaultTokenDenomFromAssets(assetsForSelectedChain);

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
      fromToken?.denom,
      toToken?.denom,
      fromToken?.decimals,
      toToken?.decimals,
      fromChainId,
      toChainId,
      fromAddress,
      toAddress,
      transferType,
      amount,
      dydxAddress,
    ],
    queryFn: async () => {
      // this should never happen, this is just to satisfy typescript
      // react queries should never return null.
      if (!hasAllParams) return null;

      const baseParams: Partial<MsgsDirectRequest> = {
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
        if (isDenomCctp(toToken.denom)) {
          return skipClient.msgsDirect({
            // TODO: remove this typecast
            ...(baseParams as MsgsDirectRequest),
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
          ...(baseParams as MsgsDirectRequest),
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

      if (isDenomCctp(fromToken.denom)) {
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
  const { addOrUpdateTransferNotification } = useLocalNotifications();

  const clearTransferState = () => {
    setFromTokenDenom('');
    setToTokenDenom('');
    setToAddress('');
    setToChainId('');
    setAmount('');
  };
  console.log('fromToken', fromToken);
  console.log('toToken', toToken);

  return {
    // TODO TRIM THIS LIST
    // expose some general clear/setState functions that the onboarding modals can call on close and mount
    // ex:
    // setInitialWithdrawState -> sets fromChainId, toChainId, fromTokenDenom, toTokenDenom, fromAddress, amount, etc. all at once
    // consider converting all this state into a local reducer
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
    clearTransferState,
  };
};
