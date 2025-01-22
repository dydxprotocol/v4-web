import { mapValues } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { getTickSizeDecimalsFromPrice } from '@/lib/numbers';

import { AssetInfo, AssetInfos } from '../types/rawTypes';
import { AssetData, AssetDataForPerpetualMarketSummary } from '../types/summaryTypes';

export const parseAssetInfo = weakMapMemoize(
  (assetInfo: AssetInfo, assetId: string): AssetData => ({
    assetId,
    name: assetInfo.name,
    logo: assetInfo.logo,
    price: assetInfo.price,
    marketCap: assetInfo.market_cap,
    volume24h: assetInfo.volume_24h,
    percentChange24h: assetInfo.percent_change_24h,
    reportedMarketCap: assetInfo.self_reported_market_cap,
    sectorTags: assetInfo.sector_tags,
    tickSizeDecimals: getTickSizeDecimalsFromPrice(assetInfo.price),
    urls: {
      website: assetInfo.urls.website,
      technicalDoc: assetInfo.urls.technical_doc,
      cmc: assetInfo.urls.cmc,
    },
  })
);

export function formatAssetDataForPerpetualMarketSummary(
  assetData: AssetData
): AssetDataForPerpetualMarketSummary & {
  spotVolume24h: number | null;
} {
  return {
    name: assetData.name,
    logo: assetData.logo,
    marketCap: assetData.marketCap,
    reportedMarketCap: assetData.reportedMarketCap,
    sectorTags: assetData.sectorTags,
    urls: assetData.urls,
    spotVolume24h: assetData.volume24h,
  };
}

export const transformAssetsInfo = (assetsInfo: AssetInfos | undefined) => {
  if (assetsInfo == null) {
    return assetsInfo;
  }

  // Add id field to each assetInfo
  return mapValues(assetsInfo, (assetInfo, key) => parseAssetInfo(assetInfo, key));
};
