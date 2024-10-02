import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { Asset, Chain, MsgsDirectRequest } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { parseUnits } from 'viem';

import { isDenomCctp, isTokenCctp } from '@/constants/cctp';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  NEUTRON_BECH32_PREFIX,
  OSMO_BECH32_PREFIX,
} from '@/constants/graz';
import {
  ConnectorType,
  DydxAddress,
  EvmAddress,
  SolAddress,
  WalletInfo,
  WalletType,
} from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { convertBech32Address } from '@/lib/addressUtils';

import { skipClient } from '../../lib/skip';
import { useAccounts } from '../useAccounts';
import { useLocalNotifications } from '../useLocalNotifications';

export enum TransferType {
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW',
}

const UNISWAP_VENUES = [
  {
    name: 'ethereum-uniswap',
    chainID: '1',
  },
  {
    name: 'polygon-uniswap',
    chainID: '137',
  },
  {
    name: 'optimism-uniswap',
    chainID: '10',
  },
  {
    name: 'arbitrum-uniswap',
    chainID: '42161',
  },
  {
    name: 'base-uniswap',
    chainID: '8453',
  },
  {
    name: 'avalanche-uniswap',
    chainID: '43114',
  },
  {
    name: 'binance-uniswap',
    chainID: '56',
  },
  {
    name: 'celo-uniswap',
    chainID: '42220',
  },
  {
    name: 'blast-uniswap',
    chainID: '81457',
  },
];

const COSMOS_SWAP_VENUES = [
  {
    name: 'osmosis-poolmanager',
    chainID: 'osmosis-1',
  },
  {
    name: 'neutron-astroport',
    chainID: 'neutron-1',
  },
];

const SWAP_VENUES = [...UNISWAP_VENUES, ...COSMOS_SWAP_VENUES];

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
  const assetsByChain = await skipClient.assets({
    includeEvmAssets: true,
    includeSvmAssets: true,
  });
  const assetsByDenom = Object.values(assetsByChain).reduce<Record<string, Asset>>(
    (assetsByDenomMap, nextAssets) => {
      const assetsByDenomForChain = nextAssets.reduce((assetsByDenomForChainMap, nextAsset) => {
        return {
          ...assetsByDenomForChainMap,
          [nextAsset.denom]: nextAsset,
        };
      }, {});
      return {
        ...assetsByDenomMap,
        ...assetsByDenomForChain,
      };
    },
    {}
  );
  return { assetsByChain, assetsByDenom };
};

const balancesQueryFn = () => {
  return [];
};

type NetworkType = 'evm' | 'svm' | 'cosmos' | 'unknown';
const getNetworkTypeFromWallet = (connectedWalletInfo?: WalletInfo): NetworkType => {
  if (connectedWalletInfo?.connectorType === ConnectorType.Injected) {
    return 'evm';
  }
  if (connectedWalletInfo?.connectorType === ConnectorType.PhantomSolana) {
    return 'svm';
  }
  if (connectedWalletInfo?.connectorType === ConnectorType.Cosmos) {
    return 'cosmos';
  }
  return 'evm';
};

const getDefaultChainIDFromNetworkType = (networkType: NetworkType): string | undefined => {
  if (networkType === 'evm') return '1';
  if (networkType === 'svm') return 'solana';
  if (networkType === 'cosmos') return 'noble';
  return undefined;
};

const getDefaultTokenDenomFromAssets = (assets: Asset[]): string => {
  const cctpToken = assets.find((asset) => {
    return isTokenCctp(asset);
  });
  const nativeChainToken = assets.find((asset) => {
    return asset.denom.endsWith('native');
  });
  const defaultTokenDenom = cctpToken?.denom ?? nativeChainToken?.denom ?? assets[0]?.denom;
  return defaultTokenDenom;
};

export const TransfersProvider = ({ ...props }) => {
  return <TransfersContext.Provider value={useTransfersContext()} {...props} />;
};

const useTransfersContext = () => {
  const { dydxAddress, evmAddress, solAddress, nobleAddress, connectedWallet } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const [fromTokenDenom, setFromTokenDenom] = useState<string | null>(null);
  const [fromChainId, setFromChainId] = useState<string>('1');
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
  const [decimals, setDecimals] = useState<number>(0);

  const walletNetworkType = getNetworkTypeFromWallet(connectedWallet);
  const selectedChainId = transferType === TransferType.Deposit ? fromChainId : toChainId;
  // console.log('from chain id', fromChainId);
  // console.log('connectedWallet', connectedWallet);
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
  const { assetsByChain = {}, assetsByDenom = {} } = assetsQuery.data ?? {};
  // console.log('all chains', skipSupportedChains);
  // console.log('all Assets', assetsByChain);
  // only calculate this once! use memo this
  const chainsForNetwork = useMemo(
    () => chainsByNetworkMap?.[walletNetworkType] ?? [],
    [walletNetworkType, chainsByNetworkMap]
  );

  // we only want to get all assets for EVM, cosmos and sol we have a specific list of items to retrieve
  // although it may be worth just grabbing all sol chain and noble/osmosis/neutron balances anyway? for the future?
  // we'll latency test this. it might not be that bad
  // not sure if we need this?
  // const assetsForNetworkByDenom = assetsForNetwork.reduce((assetsByChain, nextAsset) => {
  //   const assetsListForNetwork = assetsByChain[nextAsset.denom] ?? [];
  //   assetsByChain[nextAsset.denom] = [...assetsListForNetwork, nextAsset];
  //   return assetsByChain;
  // }, {});

  // use skip endpoint to retrieve all balances necessary
  // const balancesQuery = useQuery({
  //   queryKey: ['assetBalances'],
  //   queryFn: balancesQueryFn,
  //   refetchOnWindowFocus: false,
  //   refetchOnMount: false,
  //   refetchOnReconnect: false,
  // });
  // response is like
  // {
  //   chains: {
  //     '1': {
  //       denoms: {
  //         '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
  //           amount: '156000000',
  //           decimals: 6,
  //           formatted_amount: '156.000000',
  //           price: '1.001000',
  //           value_usd: '156.156000',
  //         },
  //         '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': {
  //           amount: '',
  //           formatted_amount: '',
  //           error: { message: 'token not found' },
  //         },
  //       },
  //     },
  //   },
  // };

  // const assetsForNetworkWithBalances = assetsForNetwork.map((asset) => {
  //   const { chain_id, denom } = asset;
  //   const balanceObj = balancesQuery.data?.chains[chain_id].denoms[denom];
  //   return { ...asset, usdBalance: (balanceObj ?? { value_usd: 0 }).value_usd };
  // });

  // const zeroBalanceAssets = assetsForNetworkWithBalances.filter((asset) => asset.usdBalance === 0);
  // const nonZeroBalanceAssets = assetsForNetworkWithBalances.filter(
  //   (asset) => asset.usdBalance != 0
  // );

  const assetsForSelectedChain = useMemo(() => {
    if (selectedChainId) return assetsByChain[selectedChainId] ?? [];
    return [];
  }, [selectedChainId, assetsByChain]);

  // USE EFFECT HOOKS TO ABSTRACT AWAY THE SETTING OF DEFAULT TOKENS.
  // THIS IS PROBABLY A BAD PLACE TO PUT THEM. REMOVE THEM.

  const defaultChainId =
    getDefaultChainIDFromNetworkType(walletNetworkType) ?? chainsForNetwork[0]?.chainID;

  const defaultTokenDenom = getDefaultTokenDenomFromAssets(assetsForSelectedChain);

  const getDepositSourceAddress = () => {
    if (connectedWallet?.name === WalletType.Keplr && nobleAddress) {
      return nobleAddress;
      // put sol first. some users with phantom wallet have previously connected with evm
      // so they will have both sol and evm addresses. we assume the phantom wallet
      // is connected with a sol address, not evm.
    }
    if (solAddress) {
      return solAddress;
    }
    return evmAddress;
  };

  const debouncedMsgsDirect = useCallback(
    debounce((v: MsgsDirectRequest) => skipClient.msgsDirect(v), 500),
    []
  );

  const hasAllParams =
    !!fromTokenDenom &&
    !!toTokenDenom &&
    !!toChainId &&
    !!fromChainId &&
    !!fromAddress &&
    !!toAddress &&
    !!transferType &&
    !!amount &&
    !!dydxAddress;

  const routeQuery = useQuery({
    queryKey: [
      'transferRoute',
      fromTokenDenom,
      toTokenDenom,
      fromChainId,
      toChainId,
      fromAddress,
      toAddress,
      amount,
    ],
    queryFn: async () => {
      // return { route: {}, txs: [{ evmTx: {} }] };
      console.log('route query fn hit', {
        fromTokenDenom,
        toTokenDenom,
        toChainId,
        fromChainId,
        fromAddress,
        toAddress,
        transferType,
        amount,
        dydxAddress,
      });
      // should never happen, this is just to satisfy types
      // but react queries should never return null.
      if (!hasAllParams) return null;

      if (transferType === TransferType.Withdraw) {
        if (isDenomCctp(fromTokenDenom)) {
          return skipClient.msgsDirect({
            sourceAssetDenom: fromTokenDenom,
            sourceAssetChainID: fromChainId,
            destAssetDenom: toTokenDenom,
            destAssetChainID: toChainId,
            chainIdsToAddresses: {
              [selectedDydxChainId]: dydxAddress,
            },
            allowUnsafe: true,

            // set bridges specifically
            bridges: ['IBC', 'AXELAR'],
            smartRelay: true,
            allowSwaps: true,
            amountIn: parseUnits(amount, decimals).toString(),
            swapVenues: SWAP_VENUES,
            allowMultiTx: false,
          });
        }
        // Non cctp withdrawals
        return skipClient.msgsDirect({
          sourceAssetDenom: fromTokenDenom,
          sourceAssetChainID: fromChainId,
          destAssetDenom: toTokenDenom,
          destAssetChainID: toChainId,
          chainIdsToAddresses: {
            [selectedDydxChainId]: dydxAddress,
            [toChainId]: toAddress,
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
          },
          allowUnsafe: true,
          bridges: ['IBC', 'AXELAR'],
          swapVenues: COSMOS_SWAP_VENUES,
          allowMultiTx: false,
          smartRelay: true,
          allowSwaps: true,
          amountIn: parseUnits(amount, decimals).toString(),
        });
      }
      const sourceAddress = getDepositSourceAddress();
      if (isDenomCctp(fromTokenDenom)) {
        // CCTP Deposits
        return skipClient.msgsDirect({
          sourceAssetDenom: fromTokenDenom,
          sourceAssetChainID: fromChainId,
          destAssetDenom: toTokenDenom,
          destAssetChainID: toChainId,
          chainIdsToAddresses: {
            [fromChainId]: sourceAddress,
            [toChainId]: dydxAddress,
          },
          allowUnsafe: true,
          bridges: ['CCTP', 'IBC'],
          smartRelay: true,
          amountIn: parseUnits(amount, decimals).toString(),
        });
      }
      return skipClient.msgsDirect({
        sourceAssetDenom: fromTokenDenom,
        sourceAssetChainID: fromChainId,
        destAssetDenom: toTokenDenom,
        destAssetChainID: toChainId,
        chainIdsToAddresses: {
          [fromChainId]: sourceAddress,
          [toChainId]: dydxAddress,
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
        },
        allowUnsafe: true,
        bridges: ['CCTP', 'IBC', 'AXELAR'],
        smartSwapOptions: { evmSwaps: true },
        amountIn: parseUnits(amount, decimals).toString(),
        slippageTolerancePercent: '1',
        swapVenues: SWAP_VENUES,
      });
    },
    enabled: hasAllParams,
  });

  const route = routeQuery?.data;
  // console.log('route', route);
  const { addOrUpdateTransferNotification } = useLocalNotifications();

  // const setDefaultTokenAndChain = () => {
  //   const
  // }

  return {
    // TRIM THIS LIST, ITS YOOOOJ
    assetsByDenom,
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
    setDecimals,
    defaultChainId,
    defaultTokenDenom,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const submitEvmRoute = () => {
//   if (!route) return;
//   skipClient.executeRoute({
//     route,
//     onTransactionTracked: async ({ txHash, chainID }) => {
//       addOrUpdateTransferNotification();
//     },
//     userAddresses: {},
//   });
// };
// const submitCosmosRoute = () => {
//   if (!route) return;
//   skipClient.executeRoute({
//     route,
//     onTransactionTracked: ({ txHash, chainID }) => {
//       addOrUpdateTransferNotification();
//     },
//     userAddresses: {},
//   });
// };
// const submitSvmRoute = () => {
//   if (!route) return;
//   skipClient.executeRoute({
//     route,
//     onTransactionTracked: ({ txHash, chainID }) => {
//       addOrUpdateTransferNotification();
//     },
//     userAddresses: {},
//   });
// };
