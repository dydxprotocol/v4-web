import { GOVERNANCE_CONFIG_MAP } from '@/constants/networks';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

export interface GovernanceVariables {
  newMarketProposal: {
    initialDepositAmount: number;
    delayBlocks: number;
    newMarketsMethodology: string;
  };
}

export const useGovernanceVariables = (): GovernanceVariables => {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const governanceVars = GOVERNANCE_CONFIG_MAP[selectedDydxChainId] as GovernanceVariables;
  return governanceVars;
};
