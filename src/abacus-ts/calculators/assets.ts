import { mapValues } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { MetadataServiceAssetInfo, MetadataServiceInfoResponse } from '@/constants/assetMetadata';

export const parseAssetInfo = weakMapMemoize(
  (assetInfo: MetadataServiceAssetInfo & { assetId: string }) => ({
    assetId: assetInfo.assetId,
    name: assetInfo.name,
    logo: assetInfo.logo,
    urls: {
      website: assetInfo.urls.website,
      technicalDoc: assetInfo.urls.technical_doc,
      cmc: assetInfo.urls.cmc,
    },
  })
);

export const transformAssetsInfo = (assetsInfo: MetadataServiceInfoResponse | undefined) => {
  if (assetsInfo == null) {
    return assetsInfo;
  }

  // Add id field to each assetInfo
  return mapValues(assetsInfo, (assetInfo, key) => parseAssetInfo({ ...assetInfo, assetId: key }));
};
