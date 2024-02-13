import { GOVERNANCE_CONFIG_MAP } from '@/constants/networks';
import { useSelectedNetwork } from '@/hooks';

export interface GovernanceVariables {
  newMarketProposal: {
    initialDepositAmount: number;
    delayBlocks: number;
    newMarketsMethodology: string;
  };
}

export const useGovernanceVariables = (): GovernanceVariables => {
  const { selectedDydxChainId } = useSelectedNetwork();
  const governanceVars = GOVERNANCE_CONFIG_MAP[selectedDydxChainId] as GovernanceVariables;
  return governanceVars;
};
