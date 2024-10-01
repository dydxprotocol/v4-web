import { createContext, useContext, useEffect, useMemo } from 'react';

import { Asset, Chain } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';

import { isTokenCctp } from '@/constants/cctp';
import { ConnectorType, WalletInfo } from '@/constants/wallets';

import { NATIVE_TOKEN_ADDRESS, skipClient } from '@/lib/skip';

import { useAccounts } from '../useAccounts';
import { TransferType, useTransfers } from './useTransfers';

type AssetsContextType = ReturnType<typeof useAssetsContext>;
const AssetsContext = createContext<AssetsContextType | undefined>(undefined);
AssetsContext.displayName = 'Assets';

export const AssetsProvider = ({ ...props }) => {
  return <AssetsContext.Provider value={useAssetsContext()} {...props} />;
};

// Custom Hook to use the context
export const useAssets = () => {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetsProvider');
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
  return 'unknown';
};

const useAssetsContext = () => {
  const { fromChainId, toChainId, transferType, setFromTokenDenom } = useTransfers();
  // console.log('transfertype in use assets from', transferType);
  const { connectedWallet, dydxAddress } = useAccounts();
  const walletNetworkType = getNetworkTypeFromWallet(connectedWallet);

  const selectedChainId = transferType === TransferType.Deposit ? fromChainId : toChainId;
  // console.log('selected chain id', selectedChainId);
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
  const { skipSupportedChains = [], chainsByNetworkMap = {} } = chainsQuery.data ?? {};
  const { assetsByChain = {}, assetsByDenom = {} } = assetsQuery.data ?? {};
  // console.log('all chains', skipSupportedChains);
  // console.log('all Assets', assetsByChain);
  // only calculate this once! use memo this
  const chainsForNetwork = chainsByNetworkMap?.[walletNetworkType] ?? [];
  const assetsForNetwork = useMemo(() => {
    // console.log('dydxadddress', dydxAddress);
    // console.log('query success', chainsQuery.isSuccess, assetsQuery.isSuccess);
    // console.log('chains by network map', chainsByNetworkMap);
    // console.log('walletNetworkType', walletNetworkType);
    // console.log('chains for network', chainsForNetwork);
    const r = chainsForNetwork.reduce<Asset[]>((assetsList, nextChain) => {
      const assetsForChain = assetsByChain[nextChain.chainID] ?? [];
      return [...assetsList, ...assetsForChain];
    }, []);
    // console.log('assets for network', r);
    const formattedAssets = r.map((asset) => ({
      type: asset.denom,
      stringKey: asset.name,
      symbol: asset.symbol,
      iconUrl: asset.logoURI,
    }));
    // console.log(formattedAssets);
    return formattedAssets;
  }, [chainsQuery.isSuccess, assetsQuery.isSuccess, walletNetworkType, dydxAddress]);

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

  const assetsForSelectedChain = (selectedChainId ? assetsByChain[selectedChainId] : []).map(
    (asset) => ({
      ...asset,
      name: asset.name,
      iconUrl: asset.logoURI,
      type: asset.denom,
      stringKey: asset.name,
    })
  );
  useEffect(() => {
    if (transferType === TransferType.Deposit) {
      console.log(assetsForSelectedChain);
      const cctpToken = assetsForSelectedChain.find((asset) => {
        return isTokenCctp(asset);
      });
      const nativeChainToken = assetsForSelectedChain.find((asset) => {
        return asset.denom === NATIVE_TOKEN_ADDRESS;
      });
      setFromTokenDenom(
        cctpToken?.denom ?? nativeChainToken?.denom ?? assetsForSelectedChain[0]?.denom
      );
    }
  }, [selectedChainId]);

  return {
    skipSupportedChains,
    chainsForNetwork,
    assetsByChain,
    assetsForNetwork,
    assetsForSelectedChain,
    assetsByDenom,
    // zeroBalanceAssets,
    // nonZeroBalanceAssets,
  };
};
