export enum RiskLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export function marginRiskLevel(marginUsage: number): RiskLevel {
  if (marginUsage < 0.2) {
    return RiskLevel.LOW;
  }
  if (marginUsage < 0.4) {
    return RiskLevel.MEDIUM;
  }
  return RiskLevel.HIGH;
}

export function leverageRiskLevel(leverage: number): RiskLevel {
  if (leverage <= 2) {
    return RiskLevel.LOW;
  }
  if (leverage <= 5) {
    return RiskLevel.MEDIUM;
  }
  return RiskLevel.HIGH;
}
