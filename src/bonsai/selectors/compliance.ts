import { createAppSelector } from '@/state/appTypes';

import { calculateCompliance } from '../calculators/compliance';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import {
  selectRawGeo,
  selectRawGeoHeaders,
  selectRawLocalAddressScreenV2,
  selectRawSourceAddressScreenV2,
} from './base';

export const selectCompliance = createAppSelector(
  [
    selectRawGeo,
    selectRawGeoHeaders,
    selectRawSourceAddressScreenV2,
    selectRawLocalAddressScreenV2,
  ],
  (geo, geoHeaders, sourceAddressScreenV2, localAddressScreenV2) =>
    calculateCompliance({ geoHeaders, geo, localAddressScreenV2, sourceAddressScreenV2 })
);

export const selectComplianceLoading = createAppSelector(
  [
    selectRawGeo,
    selectRawGeoHeaders,
    selectRawSourceAddressScreenV2,
    selectRawLocalAddressScreenV2,
  ],
  (geo, geoHeaders, sourceAddressScreenV2, localAddressScreenV2) =>
    mergeLoadableStatus(geo, geoHeaders, localAddressScreenV2, sourceAddressScreenV2)
);

export const selectIsGeoRestricted = createAppSelector(
  [selectRawGeoHeaders],
  (geoHeaders) => geoHeaders.data?.status === 'restricted'
);
