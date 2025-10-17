import { createAppSelector } from '@/state/appTypes';

import {
  selectRawSolPrice,
  selectRawSolPriceLoading,
  selectRawTokenMetadata,
  selectRawTokenMetadataLoading,
} from './base';

export const selectSolPrice = createAppSelector([selectRawSolPrice], (solPrice) => solPrice?.price);

export const selectSolPriceLoading = createAppSelector(
  [selectRawSolPriceLoading],
  (loading) => loading
);

export const selectTokenMetadata = createAppSelector(
  [selectRawTokenMetadata],
  (tokenMetadata) => tokenMetadata?.tokenInfo
);

export const selectTokenMetadataLoading = createAppSelector(
  [selectRawTokenMetadataLoading],
  (loading) => loading
);

export const selectSpotData = createAppSelector(
  [selectSolPrice, selectTokenMetadata],
  (solPrice, tokenMetadata) => ({
    solPrice,
    tokenMetadata,
  })
);
