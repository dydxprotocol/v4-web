import styled, { type AnyStyledComponent } from 'styled-components';

import { type RiskLevels } from '@/constants/abacus';

import { UsageColorFromRiskLevel } from '@/styles/globalStyle';

import { abacusHelper } from '@/lib/abacus';
type ElementProps = {
  value: number;
};

type StyleProps = {
  className?: string;
};

export const UsageBars = ({ value, className }: ElementProps & StyleProps) => (
  <Styled.UsageBars className={className} riskLevel={abacusHelper.leverageRiskLevel(value ?? 0)}>
    {Array.from({ length: 3 }, (_, i) => (
      <Styled.Bar
        key={i}
        style={{
          '--i': i,
          '--l': 3,
        }}
        active={i <= abacusHelper.leverageRiskLevel(value ?? 0).ordinal}
      />
    ))}
  </Styled.UsageBars>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.UsageBars = styled.div<{ riskLevel: RiskLevels }>`
  ${({ riskLevel }) => UsageColorFromRiskLevel(riskLevel)}

  width: 0.875rem;
  height: 0.875rem;
  display: flex;
  align-items: end;
  justify-content: space-between;
`;

Styled.Bar = styled.div<{ active: boolean }>`
  --active-delay: calc(0.2s * calc(var(--i) + 1));

  max-width: 3px;
  height: min(calc(100% / calc(var(--l) - var(--i)) + 0.1rem), 100%);
  opacity: ${({ active }) => (active ? 1 : 0.2)};
  flex: 1;
  background-color: currentColor;
  border-radius: 1px;

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.3s linear var(--active-delay);
  }
`;
