import { useMemo } from 'react';

import { mergeLoadableStatusState } from '@/bonsai/lib/mapLoadable';
import { BonsaiCore } from '@/bonsai/ontology';

import { useAppSelector } from '@/state/appTypes';

import { getMarketIdFromAsset } from '@/lib/assetUtils';
import { orEmptyRecord } from '@/lib/typeUtils';

export const useLaunchableMarkets = () => {
  const perpsRaw = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));
  const assetsRaw = orEmptyRecord(useAppSelector(BonsaiCore.markets.assets.data));
  const loadingStateMarkets = useAppSelector(BonsaiCore.markets.markets.loading);
  const loadingStateAssets = useAppSelector(BonsaiCore.markets.assets.loading);
  const loadingState = mergeLoadableStatusState(loadingStateMarkets, loadingStateAssets);

  const filteredPotentialMarkets: { id: string; asset: string }[] = useMemo(() => {
    const assets = Object.values(assetsRaw).map((asset) => {
      return {
        id: getMarketIdFromAsset(asset.assetId),
        asset: asset.assetId,
      };
    });

    return assets.filter(({ id }) => {
      return perpsRaw[id] == null;
    });
  }, [assetsRaw, perpsRaw]);

  return {
    data: filteredPotentialMarkets,
    isLoading:
      (Object.keys(perpsRaw).length === 0 || Object.keys(assetsRaw).length === 0) &&
      (loadingState === 'idle' || loadingState === 'pending'),
  };
};
