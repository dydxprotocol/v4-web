import { css } from 'styled-components';

import { type RiskLevels } from '@/constants/abacus';

export const UsageColorFromRiskLevel = (riskLevel: RiskLevels) =>
  ({
    low: css`
      color: var(--color-risk-low);
    `,
    medium: css`
      color: var(--color-risk-medium);
    `,
    high: css`
      color: var(--color-risk-high);
    `,
  }[riskLevel.name]);
