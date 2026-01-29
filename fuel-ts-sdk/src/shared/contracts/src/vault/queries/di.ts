import type { VaultContractPort } from '../../VaultContractPort';
import { createGetFundingInfoQuery } from './getFundingInfo';

export interface VaultQueriesDependencies {
  vaultContractPort: VaultContractPort;
}

export const createVaultQueries = (deps: VaultQueriesDependencies) => ({
  getFundingInfo: createGetFundingInfoQuery(deps),
});

export type VaultQueries = ReturnType<typeof createVaultQueries>;

export { FundingInfo } from './getFundingInfo';
