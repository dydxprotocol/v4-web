import { createContext, useContext } from 'react';

import { useQuery } from '@tanstack/react-query';

import { ConnectorType, WalletInfo } from '@/constants/wallets';

import { useAccounts } from './useAccounts';

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

const chainsQueryFn = () => {
  return [];
};

const assetsQueryFn = () => {
  return [];
};

const balancesQueryFn = () => {
  return [];
};

type NetworkType = 'evm' | 'sol' | 'cosmos' | 'unknown';
const getNetworkTypeFromWallet = (connectedWalletInfo?: WalletInfo): NetworkType => {
  if (connectedWalletInfo?.connectorType === ConnectorType.Injected) {
    return 'evm';
  }
  if (connectedWalletInfo?.connectorType === ConnectorType.PhantomSolana) {
    return 'sol';
  }
  if (connectedWalletInfo?.connectorType === ConnectorType.Cosmos) {
    return 'cosmos';
  }
  return 'unknown';
};

const useAssetsContext = () => {
  const { connectedWallet } = useAccounts();
  const walletNetworkType = getNetworkTypeFromWallet(connectedWallet);
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
  const allAvailableChains = chainsQuery.data;
  const allAvailableAssets = assetsQuery.data;

  // only calculate this once! use memo this
  const chainsByNetworkMap = allAvailableChains.reduce((chainsMap, nextChain) => {
    const chainsListForNetworkType = chainsMap[nextChain.chain_type] ?? [];
    chainsMap[nextChain.chain_type] = [...chainsListForNetworkType, nextChain];
    return chainsMap;
  }, {});

  const chainsForNetwork = chainsByNetworkMap[walletNetworkType];

  // we only want to get all assets for EVM, cosmos and sol we have a specific list of items to retrieve
  // although it may be worth just grabbing all sol chain and noble/osmosis/neutron balances anyway? for the future?
  // we'll latency test this. it might not be that bad
  const assetsForNetwork = chainsForNetwork.reduce((assetsList, nextChain) => {
    const assetsForChain = allAvailableAssets[nextChain.chain_id].assets;
    return [...assetsList, ...assetsForChain];
  }, []);

  // not sure if we need this?
  // const assetsForNetworkByDenom = assetsForNetwork.reduce((assetsMap, nextAsset) => {
  //   const assetsListForNetwork = assetsMap[nextAsset.denom] ?? [];
  //   assetsMap[nextAsset.denom] = [...assetsListForNetwork, nextAsset];
  //   return assetsMap;
  // }, {});

  // use skip endpoint to retrieve all balances necessary
  const balancesQuery = useQuery({
    queryKey: ['assetBalances'],
    queryFn: balancesQueryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
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

  const assetsForNetworkWithBalances = assetsForNetwork.map((asset) => {
    const { chain_id, denom } = asset;
    const balanceObj = balancesQuery.data?.chains[chain_id].denoms[denom];
    return { ...asset, usdBalance: (balanceObj ?? { value_usd: 0 }).value_usd };
  });

  const zeroBalanceAssets = assetsForNetworkWithBalances.filter((asset) => asset.usdBalance === 0);
  const nonZeroBalanceAssets = assetsForNetworkWithBalances.filter(
    (asset) => asset.usdBalance != 0
  );

  return {
    allAvailableChains,
    allAvailableAssets,
    assetsForNetwork,
    zeroBalanceAssets,
    nonZeroBalanceAssets,
  };
};
