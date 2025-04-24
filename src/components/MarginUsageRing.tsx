import styled from 'styled-components';

import { Ring } from '@/components/Ring';

import { marginRiskLevel, RiskLevel, UsageColorFromRiskLevel } from '@/lib/styles';

type ElementProps = {
  value: number;
};

type StyleProps = {
  className?: string;
};

export const MarginUsageRing = ({ className, value }: ElementProps & StyleProps) => (
  <$MarginUsageRing className={className} value={value} riskLevel={marginRiskLevel(value)} />
);
const $MarginUsageRing = styled(Ring)<{ riskLevel: RiskLevel }>`
  ${({ riskLevel }) => UsageColorFromRiskLevel(riskLevel)}
  width: 1rem;
  height: 1rem;
`;
