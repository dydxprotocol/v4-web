import styled, { type AnyStyledComponent } from 'styled-components';

import { RiskLevels } from '@/constants/abacus';

import { Ring } from '@/components/Ring';

import { abacusHelper } from '@/lib/abacus';
import { UsageColorFromRiskLevel } from '@/lib/styles';

type ElementProps = {
  value: number;
};

type StyleProps = {
  className?: string;
};

export const MarginUsageRing = ({ className, value }: ElementProps & StyleProps) => (
  <Styled.MarginUsageRing
    className={className}
    value={value}
    riskLevel={abacusHelper.marginRiskLevel(value)}
  />
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarginUsageRing = styled(Ring)<{ riskLevel: RiskLevels }>`
  ${({ riskLevel }) => UsageColorFromRiskLevel(riskLevel)}
  width: 1rem;
  height: 1rem;
`;
