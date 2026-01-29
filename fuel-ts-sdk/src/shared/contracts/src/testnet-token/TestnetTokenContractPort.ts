import type { Contract } from 'fuels';

export interface TestnetTokenContractPort {
  getTestnetTokenContract(): Promise<Contract>;
}
