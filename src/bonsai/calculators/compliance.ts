import { ComplianceState } from '@/state/raw';

import { Compliance, ComplianceStatus } from '../types/summaryTypes';

export function calculateCompliance({
  geoHeaders,
  geo: geoBase,
  localAddressScreenV2,
  sourceAddressScreenV2,
  solanaAddressScreen,
}: ComplianceState): Compliance {
  const geo = {
    isPerpetualsGeoBlocked: geoBase.data?.whitelisted
      ? false
      : geoHeaders.data?.status === 'restricted',
    currentCountry: geoHeaders.data?.country,
  };

  if (sourceAddressScreenV2.data?.status === ComplianceStatus.BLOCKED) {
    return {
      geo,
      status: ComplianceStatus.BLOCKED,
      updatedAt: sourceAddressScreenV2.data.updatedAt,
    };
  }

  if (solanaAddressScreen.data?.status === ComplianceStatus.BLOCKED) {
    return {
      geo,
      status: ComplianceStatus.BLOCKED,
      updatedAt: solanaAddressScreen.data.updatedAt,
    };
  }

  if (localAddressScreenV2.data?.errors != null) {
    return {
      geo,
      status: ComplianceStatus.UNKNOWN,
    };
  }

  return {
    geo,
    ...(localAddressScreenV2.data ?? {
      status: ComplianceStatus.UNKNOWN,
    }),
  };
}
