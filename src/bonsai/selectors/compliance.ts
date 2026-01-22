import { createAppSelector } from '@/state/appTypes';

import { calculateCompliance } from '../calculators/compliance';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import {
  selectRawGeo,
  selectRawGeoHeaders,
  selectRawLocalAddressScreenV2,
  selectRawSolanaAddressScreen,
  selectRawSourceAddressScreenV2,
} from './base';

export const selectCompliance = createAppSelector(
  [
    selectRawGeo,
    selectRawGeoHeaders,
    selectRawSourceAddressScreenV2,
    selectRawLocalAddressScreenV2,
    selectRawSolanaAddressScreen,
  ],
  (geo, geoHeaders, sourceAddressScreenV2, localAddressScreenV2, solanaAddressScreen) =>
    calculateCompliance({
      geoHeaders,
      geo,
      localAddressScreenV2,
      sourceAddressScreenV2,
      solanaAddressScreen,
    })
);

export const selectComplianceLoading = createAppSelector(
  [
    selectRawGeo,
    selectRawGeoHeaders,
    selectRawSourceAddressScreenV2,
    selectRawLocalAddressScreenV2,
    selectRawSolanaAddressScreen,
  ],
  (geo, geoHeaders, sourceAddressScreenV2, localAddressScreenV2, solanaAddressScreen) =>
    mergeLoadableStatus(
      geo,
      geoHeaders,
      localAddressScreenV2,
      sourceAddressScreenV2,
      solanaAddressScreen
    )
);

export const selectIsPerpsGeoRestricted = createAppSelector(
  [selectRawGeoHeaders],
  (geoHeaders) => geoHeaders.data?.status === 'restricted'
);
