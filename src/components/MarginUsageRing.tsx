import styled from 'styled-components';

import { Ring } from '@/components/Ring';

import { marginRiskLevel, RiskLevel } from '@/lib/risk';
import { usageColorFromRiskLevel } from '@/lib/styles';

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
  ${({ riskLevel }) => usageColorFromRiskLevel(riskLevel)}
  width: 1rem;
  height: 1rem;
`;
