import { ComplianceStates } from '@/constants/compliance';

import { calculateShouldRenderTriggersInPositionsTable } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { usePerpetualsComplianceState } from './usePerpetualsComplianceState';

export const useShouldShowTriggers = () => {
  const shouldRenderTriggers = useAppSelector(calculateShouldRenderTriggersInPositionsTable);
  const { complianceState } = usePerpetualsComplianceState();

  return shouldRenderTriggers && complianceState === ComplianceStates.FULL_ACCESS;
};
