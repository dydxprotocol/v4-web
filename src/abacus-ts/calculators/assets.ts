import { mapValues } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { getTickSizeDecimalsFromPrice } from '@/lib/numbers';

import { AssetInfo, AssetInfos } from '../types/rawTypes';

export const parseAssetInfo = weakMapMemoize((assetInfo: AssetInfo, assetId: string) => ({
  assetId,
  name: assetInfo.name,
  logo: assetInfo.logo,
  price: assetInfo.price,
  marketCap: assetInfo.market_cap,
  volume24h: assetInfo.volume_24h,
  percentChange24h: assetInfo.percent_change_24h,
  reportedMarketCap: assetInfo.self_reported_market_cap,
  tickSizeDecimals: getTickSizeDecimalsFromPrice(assetInfo.price),
  urls: {
    website: assetInfo.urls.website,
    technicalDoc: assetInfo.urls.technical_doc,
    cmc: assetInfo.urls.cmc,
  },
}));

export const transformAssetsInfo = (assetsInfo: AssetInfos | undefined) => {
  if (assetsInfo == null) {
    return assetsInfo;
  }

  // Add id field to each assetInfo
  return mapValues(assetsInfo, (assetInfo, key) => parseAssetInfo(assetInfo, key));
};
