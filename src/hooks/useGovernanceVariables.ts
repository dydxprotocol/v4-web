import { useSelector } from 'react-redux';

import { GOVERNANCE_CONFIG_MAP } from '@/constants/networks';

import { getSelectedDydxChainId } from '@/state/appSelectors';

export interface GovernanceVariables {
  newMarketProposal: {
    initialDepositAmount: number;
    delayBlocks: number;
    newMarketsMethodology: string;
  };
}

export const useGovernanceVariables = (): GovernanceVariables => {
  const selectedDydxChainId = useSelector(getSelectedDydxChainId);
  const governanceVars = GOVERNANCE_CONFIG_MAP[selectedDydxChainId] as GovernanceVariables;
  return governanceVars;
};
