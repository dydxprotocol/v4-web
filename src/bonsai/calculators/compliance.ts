import { ComplianceState } from '@/state/raw';

import { Compliance, ComplianceStatus } from '../types/summaryTypes';

export function calculateCompliance({
  geo,
  localAddressScreenV2,
  sourceAddressScreenV2,
}: ComplianceState): Compliance {
  const geoResult = geo.data;
  if (sourceAddressScreenV2.data?.status === ComplianceStatus.BLOCKED) {
    return {
      geo: geoResult,
      status: ComplianceStatus.BLOCKED,
      updatedAt: sourceAddressScreenV2.data.updatedAt,
    };
  }
  if (localAddressScreenV2.data?.errors != null) {
    return {
      geo: geoResult,
      status: ComplianceStatus.UNKNOWN,
    };
  }
  return {
    geo: geoResult,
    ...(localAddressScreenV2.data ?? {
      status: ComplianceStatus.UNKNOWN,
    }),
  };
}
