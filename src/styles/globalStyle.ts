import { createGlobalStyle, css } from 'styled-components';

import { type RiskLevels } from '@/constants/abacus';

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Computed: Layers */
    --color-layer-0: ${({ theme }) => theme.layer0};
    --color-layer-1: ${({ theme }) => theme.layer1};
    --color-layer-2: ${({ theme }) => theme.layer2};
    --color-layer-3: ${({ theme }) => theme.layer3};
    --color-layer-4: ${({ theme }) => theme.layer4};
    --color-layer-5: ${({ theme }) => theme.layer5};
    --color-layer-6: ${({ theme }) => theme.layer6};
    --color-layer-7: ${({ theme }) => theme.layer7};

    /* Computed: Borders */
    --color-border: ${({ theme }) => theme.borderDefault};
    --color-border-white: ${({ theme }) => theme.borderButton}; //xcxc
    --color-border-red: ${({ theme }) => theme.borderDestructive}; //xcxc

    /* Computed: Text */
    --color-text-0: ${({ theme }) => theme.textPrimary}; //xcxc
    --color-text-1: ${({ theme }) => theme.textSecondary}; //xcxc
    --color-text-2: ${({ theme }) => theme.textTertiary}; //xcxc

    /* Computed: Accent */
    --color-accent: ${({ theme }) => theme.accent};
    --color-favorite: ${({ theme }) => theme.favorite};

    /* Computed: Status */
    --color-success: ${({ theme }) => theme.success};
    --color-warning: ${({ theme }) => theme.warning};
    --color-error: ${({ theme }) => theme.error};

    /* Computed: Directional */
    --color-positive: ${({ theme }) => theme.positive};
    --color-negative: ${({ theme }) => theme.negative};

    /* Computed: Risk */
    --color-risk-low: ${({ theme }) => theme.riskLow};
    --color-risk-medium: ${({ theme }) => theme.riskMedium};
    --color-risk-high: ${({ theme }) => theme.riskHigh};
  }
`;

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
