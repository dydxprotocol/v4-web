import { BonsaiCore } from '@/bonsai/ontology';
import { mapValues } from 'lodash';

import { RootState } from './_store';
import { createAppSelector } from './appTypes';

export const getMarketIdToAssetMetadataMap = createAppSelector(
  [(state: RootState) => state.perpetuals.markets, BonsaiCore.markets.assets.data],
  (markets, assets) => {
    const mapping = mapValues(markets ?? {}, (v) => assets?.[v.assetId]);
    return mapping;
  }
);
