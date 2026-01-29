import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { TestnetTokenContractPort } from '../TestnetTokenContractPort';
import { BaseTokenFauceted } from '../events/LiquidityAddedEvent';

export interface FaucetDependencies {
  testnetTokenContractPort: TestnetTokenContractPort;
  storeService: StoreService;
}

export const createFaucetCommand = (deps: FaucetDependencies) => async (): Promise<void> => {
  const token = await deps.testnetTokenContractPort.getTestnetTokenContract();

  const { gasUsed } = await token.functions.faucet().getTransactionCost();
  const gasLimit = gasUsed.mul('6').div('5').toString();

  const { waitForResult } = await token.functions.faucet().txParams({ gasLimit }).call();

  await waitForResult();
  deps.storeService.dispatch(BaseTokenFauceted());
};
