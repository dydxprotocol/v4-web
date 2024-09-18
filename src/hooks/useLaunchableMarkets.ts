import { useMemo } from 'react';

import { useQueries } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import {
  MetadataServiceAsset,
  MetadataServiceInfoResponse,
  MetadataServicePricesResponse,
} from '@/constants/assetMetadata';
import { MOCK_INFO, MOCK_PRICES } from '@/constants/mockMetadata';
import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import metadataClient from '@/clients/metadataService';
import { getAssetFromMarketId } from '@/lib/assetUtils';
import { getTickSizeDecimalsFromPrice } from '@/lib/numbers';

export const useLaunchableMarkets = () => {
  const marketIds = useAppSelector(getMarketIds, shallowEqual);

  const filteredPotentialMarkets: { id: string; asset: string }[] = useMemo(() => {
    const assets = Object.keys(MOCK_INFO).map((asset) => {
      return {
        id: `${asset}-USD`,
        asset,
      };
    });

    return assets.filter(({ id }) => {
      return !marketIds.includes(id);
    });
  }, [marketIds]);

  return {
    isLoading: false,
    data: filteredPotentialMarkets,
  };
};

export const useMetadataService = () => {
  const metadataQuery = useQueries({
    queries: [
      {
        queryKey: ['marketMapInfo'],
        queryFn: async (): Promise<MetadataServiceInfoResponse> => {
          return MOCK_INFO;
          return metadataClient.getAssetInfo();
        },
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ['marketMapPrice'],
        queryFn: async (): Promise<MetadataServicePricesResponse> => {
          return MOCK_PRICES;
          return metadataClient.getAssetPrices();
        },
        refetchInterval: timeUnits.minute * 5,
      },
    ],
    combine: (results) => {
      const info = results[0].data;
      const prices = results[1].data;
      const data: Record<string, MetadataServiceAsset> = {};

      Object.keys(info ?? {}).forEach((key) => {
        if (info?.[key] && prices?.[key]) {
          const tickSizeDecimals = getTickSizeDecimalsFromPrice(prices[key].price);

          data[key] = {
            id: key,
            name: info[key].name,
            logo: info[key].logo,
            urls: {
              website: info[key].urls.website,
              technicalDoc: info[key].urls.technical_doc,
              cmc: info[key].urls.cmc,
            },
            sectorTags: info[key].sector_tags,
            exchanges: info[key].exchanges,
            price: prices[key].price,
            percentChange24h: prices[key].percent_change_24h,
            marketCap: prices[key].market_cap,
            volume24h: prices[key].volume_24h,
            tickSizeDecimals,
          };
        }
      });
      return {
        data,
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
      };
    },
  });

  return metadataQuery;
};

export const useMetadataServiceAssetFromId = (marketId?: string) => {
  const metadataServiceData = useMetadataService();

  const launchableAsset = useMemo(() => {
    if (!metadataServiceData.data || !marketId) {
      return null;
    }

    const assetId = getAssetFromMarketId(marketId);
    return metadataServiceData.data?.[assetId];
  }, [metadataServiceData.data, marketId]);

  return launchableAsset;
};
