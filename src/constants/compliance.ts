export enum ComplianceReason {
  MANUAL = 'MANUAL',
  US_GEO = 'US_GEO',
  CA_GEO = 'CA_GEO',
  SANCTIONED_GEO = 'SANCTIONED_GEO',
  COMPLIANCE_PROVIDER = 'COMPLIANCE_PROVIDER',
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  FIRST_STRIKE = 'FIRST_STRIKE',
  CLOSE_ONLY = 'CLOSE_ONLY',
  BLOCKED = 'BLOCKED',
}

export enum ComplianceStates {
  FULLACCESS = 'FUllACCESS',
  READ_ONLY = 'READ_ONLY',
  CLOSE_ONLY = 'CLOSE_ONLY',
}

export const RestrictedGeo = ['US', 'CA'];
