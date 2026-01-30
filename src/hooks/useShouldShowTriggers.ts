import { ComplianceStates } from '@/constants/compliance';

import { calculateShouldRenderTriggersInPositionsTable } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { useComplianceState } from './useComplianceState';

export const useShouldShowTriggers = () => {
  const shouldRenderTriggers = useAppSelector(calculateShouldRenderTriggersInPositionsTable);
  const { complianceState } = useComplianceState();

  return shouldRenderTriggers && complianceState === ComplianceStates.FULL_ACCESS;
};
