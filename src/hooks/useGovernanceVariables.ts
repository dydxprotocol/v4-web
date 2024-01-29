import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { useSelectedNetwork } from '@/hooks';

export interface GovernanceVariables {
  newMarketProposal: {
    initialDepositAmount: number;
    delayBlocks: number;
    newMarketsMethodology: string;
  };
}

export const useGovernanceVariables = (): GovernanceVariables => {
  const { selectedNetwork } = useSelectedNetwork();
  const governanceVars = ENVIRONMENT_CONFIG_MAP[selectedNetwork].governance as GovernanceVariables;
  return governanceVars;
};
