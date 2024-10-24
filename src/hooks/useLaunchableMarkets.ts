import { useMemo } from 'react';

import { useQueries, useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';

import {
  MetadataServiceAsset,
  MetadataServiceCandlesTimeframes,
  MetadataServiceInfoResponse,
  MetadataServicePricesResponse,
} from '@/constants/assetMetadata';
import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import metadataClient from '@/clients/metadataService';
import { getAssetFromMarketId } from '@/lib/assetUtils';
import { getTickSizeDecimalsFromPrice } from '@/lib/numbers';
import { mapMetadataServiceCandles } from '@/lib/tradingView/utils';

export const useMetadataService = () => {
  const metadataQuery = useQueries({
    queries: [
      {
        queryKey: ['marketMapInfo'],
        queryFn: async (): Promise<MetadataServiceInfoResponse> => {
          return metadataClient.getAssetInfo();
        },
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ['marketMapPrice'],
        queryFn: async (): Promise<MetadataServicePricesResponse> => {
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
        const infoKey = info?.[key];
        const pricesKey = prices?.[key];
        if (infoKey && pricesKey) {
          const tickSizeDecimals = getTickSizeDecimalsFromPrice(pricesKey.price);

          data[key] = {
            id: key,
            name: infoKey.name,
            logo: infoKey.logo,
            urls: {
              website: infoKey.urls.website,
              technicalDoc: infoKey.urls.technical_doc,
              cmc: infoKey.urls.cmc,
            },
            sectorTags: infoKey.sector_tags,
            exchanges: infoKey.exchanges,
            price: pricesKey.price,
            percentChange24h: pricesKey.percent_change_24h,
            marketCap: pricesKey.market_cap,
            volume24h: pricesKey.volume_24h,
            reportedMarketCap: pricesKey.self_reported_market_cap,
            tickSizeDecimals,
          };
        }
      });

      return {
        data,
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
        isSuccess: results.every((result) => result.isSuccess),
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
    return metadataServiceData.data[assetId];
  }, [metadataServiceData.data, marketId]);

  return launchableAsset;
};

export const useLaunchableMarkets = () => {
  const marketIds = useAppSelector(getMarketIds, shallowEqual);
  const metadataServiceData = useMetadataService();

  const filteredPotentialMarkets: { id: string; asset: string }[] = useMemo(() => {
    const assets = Object.keys(metadataServiceData.data).map((asset) => {
      return {
        id: `${asset}-USD`,
        asset,
      };
    });

    return assets.filter(({ id }) => {
      return !marketIds.includes(id);
    });
  }, [marketIds, metadataServiceData.data]);

  return {
    ...metadataServiceData,
    data: filteredPotentialMarkets,
  };
};

export const useMetadataServiceCandles = (
  asset?: string,
  timeframe?: MetadataServiceCandlesTimeframes
) => {
  const candlesQuery = useQuery({
    enabled: !!asset && !!timeframe,
    queryKey: ['candles', asset, timeframe],
    queryFn: async () => {
      return metadataClient.getCandles({ asset: asset!, timeframe: timeframe! });
    },
    refetchInterval: timeUnits.minute * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    ...candlesQuery,
    data: candlesQuery.data?.[asset ?? '']?.map(mapMetadataServiceCandles),
  };
};
