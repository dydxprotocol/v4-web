import { useMemo } from 'react';

import { useMetadataService } from './useMetadataService';
import { usePerpetualMarkets } from './userPerpetualMarkets';

export const useLaunchableMarkets = () => {
  const perpetualMarketsFetch = usePerpetualMarkets();
  const metadataServiceData = useMetadataService();

  const filteredPotentialMarkets: { id: string; asset: string }[] = useMemo(() => {
    const assets = Object.keys(metadataServiceData.data).map((asset) => {
      return {
        id: `${asset}-USD`,
        asset,
      };
    });

    return assets.filter(({ id }) => {
      return !perpetualMarketsFetch.data?.[id];
    });
  }, [perpetualMarketsFetch.data, metadataServiceData.data]);

  return {
    ...metadataServiceData,
    data: filteredPotentialMarkets,
  };
};
