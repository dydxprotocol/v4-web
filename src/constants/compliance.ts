export enum ComplianceReason {
  MANUAL = 'MANUAL',
  US_GEO = 'US_GEO',
  CA_GEO = 'CA_GEO',
  SANCTIONED_GEO = 'SANCTIONED_GEO',
  COMPLIANCE_PROVIDER = 'COMPLIANCE_PROVIDER',
}

export enum ComplianceStates {
  FULL_ACCESS = 'FUll_ACCESS',
  READ_ONLY = 'READ_ONLY',
  CLOSE_ONLY = 'CLOSE_ONLY',
}

export const CLOSE_ONLY_GRACE_PERIOD = 7;
