import { css } from 'styled-components';

import { RiskLevel } from './risk';

export const usageColorFromRiskLevel = (riskLevel: RiskLevel) =>
  ({
    [RiskLevel.LOW]: css`
      color: var(--color-risk-low);
    `,
    [RiskLevel.MEDIUM]: css`
      color: var(--color-risk-medium);
    `,
    [RiskLevel.HIGH]: css`
      color: var(--color-risk-high);
    `,
  })[riskLevel];

export const generateFadedColorVariant = (colorHex: string, opacityHex: string) => {
  return `${colorHex}${opacityHex}`;
};
