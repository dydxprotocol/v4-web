import { useMemo } from 'react';

import metadataClient, { MetadataServiceAsset } from '@/clients/metadataService';
import { useQueries, useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import { MOCK_INFO, MOCK_PRICES } from '@/constants/mockMetadata';
import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { orEmptyRecord } from '@/lib/typeUtils';

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
        queryFn: async () => {
          return MOCK_INFO;
          return metadataClient.getAssetInfo();
        },
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ['marketMapPrice'],
        queryFn: async () => {
          return MOCK_PRICES;
          return metadataClient.getAssetPrices();
        },
        refetchInterval: timeUnits.minute * 5,
      },
    ],
    combine: (results) => {
      const info = orEmptyRecord(results[0].data);
      const prices = results[1].data;
      const data: Record<string, MetadataServiceAsset> = {};

      Object.keys(info).forEach((key) => {
        if (info?.[key] && prices?.[key]) {
          data[key] = {
            id: key,
            name: info[key].name,
            logo: info[key].logo,
            urls: {
              website: info[key].urls.website,
              technicalDoc: info?.[key].urls.technical_doc,
              cmc: info[key].urls.cmc,
            },
            sectorTags: info?.[key].sector_tags,
            exchanges: info?.[key].exchanges,
            price: prices[key].price,
            percentChange24h: prices[key].percent_change_24h,
            marketCap: prices[key].market_cap,
            volume24h: prices[key].volume_24h,
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

export const useMarketMapInfo = ({ assets }: { assets?: string[] }) => {
  const info = useQuery({
    queryKey: ['marketMapInfo', assets],
    queryFn: async () => {
      return metadataClient.getAssetInfo(assets);
    },
  });

  return info;
};

export const useMarketMapPrice = ({ assets }: { assets: string[] }) => {
  const prices = useQuery({
    queryKey: ['marketMapPrice', assets],
    queryFn: async () => {
      return metadataClient.getAssetPrices(assets);
    },
  });

  return prices;
};
