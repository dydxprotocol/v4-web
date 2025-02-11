import { createAppSelector } from '@/state/appTypes';

import { calculateCompliance } from '../calculators/compliance';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import {
  selectRawGeo,
  selectRawLocalAddressScreenV2,
  selectRawSourceAddressScreenV2,
} from './base';

export const selectCompliance = createAppSelector(
  [selectRawGeo, selectRawSourceAddressScreenV2, selectRawLocalAddressScreenV2],
  (geo, sourceAddressScreenV2, localAddressScreenV2) =>
    calculateCompliance({ geo, localAddressScreenV2, sourceAddressScreenV2 })
);

export const selectComplianceLoading = createAppSelector(
  [selectRawGeo, selectRawSourceAddressScreenV2, selectRawLocalAddressScreenV2],
  (geo, sourceAddressScreenV2, localAddressScreenV2) =>
    mergeLoadableStatus(geo, localAddressScreenV2, sourceAddressScreenV2)
);
