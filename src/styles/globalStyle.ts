import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --color-layer-0: ${({ theme }) => theme.layer0};
    --color-layer-1: ${({ theme }) => theme.layer1};
    --color-layer-2: ${({ theme }) => theme.layer2};
    --color-layer-3: ${({ theme }) => theme.layer3};
    --color-layer-4: ${({ theme }) => theme.layer4};
    --color-layer-5: ${({ theme }) => theme.layer5};
    --color-layer-6: ${({ theme }) => theme.layer6};
    --color-layer-7: ${({ theme }) => theme.layer7};

    --color-border: ${({ theme }) => theme.borderDefault};
    --color-border-white: ${({ theme }) => theme.borderButton}; //xcxc
    --color-border-red: ${({ theme }) => theme.borderDestructive}; //xcxc

    --color-text-0: ${({ theme }) => theme.textPrimary}; //xcxc
    --color-text-1: ${({ theme }) => theme.textSecondary}; //xcxc
    --color-text-2: ${({ theme }) => theme.textTertiary}; //xcxc

    --color-accent: ${({ theme }) => theme.accent};
    --color-favorite: ${({ theme }) => theme.favorite};

    --color-success: ${({ theme }) => theme.success};
    --color-warning: ${({ theme }) => theme.warning};
    --color-error: ${({ theme }) => theme.error};

    --color-positive: ${({ theme }) => theme.positive};
    --color-negative: ${({ theme }) => theme.negative};

    --color-risk-low: ${({ theme }) => theme.riskLow};
    --color-risk-medium: ${({ theme }) => theme.riskMedium};
    --color-risk-high: ${({ theme }) => theme.riskHigh};
  }
`;
