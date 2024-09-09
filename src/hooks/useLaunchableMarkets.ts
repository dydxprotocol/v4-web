import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { getTickerFromMarketmapId } from '@/lib/assetUtils';

import { useDydxClient } from './useDydxClient';
import { useSelectedNetwork } from './useSelectedNetwork';

export const useMarketMap = () => {
  const { selectedNetwork } = useSelectedNetwork();
  const { getMarketMap, isCompositeClientConnected } = useDydxClient();

  const launchableMarkets = useQuery({
    enabled: isCompositeClientConnected,
    queryKey: ['launchableMarkets', selectedNetwork],
    queryFn: getMarketMap,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return launchableMarkets;
};

export const useLaunchableMarkets = () => {
  const launchableMarkets = useMarketMap();
  const marketIds = useAppSelector(getMarketIds, shallowEqual);

  const filteredPotentialMarkets = useMemo(() => {
    const marketMap = launchableMarkets.data?.marketMap?.markets;
    if (!marketMap || !marketIds.length) {
      return [];
    }

    return Object.entries(marketMap)
      .map(([id, data]) => ({
        id: getTickerFromMarketmapId(id),
        ...data,
      }))
      .filter(({ id }) => {
        return !marketIds.includes(id);
      });
  }, [launchableMarkets.data, marketIds]);

  return {
    ...launchableMarkets,
    data: filteredPotentialMarkets,
  };
};
