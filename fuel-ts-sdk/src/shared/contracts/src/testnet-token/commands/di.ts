import type { FaucetDependencies } from './faucet';
import { createFaucetCommand } from './faucet';

export type TestnetTokenCommandsDependencies = FaucetDependencies;

export const createTestnetTokenCommands = (deps: TestnetTokenCommandsDependencies) => ({
  faucet: createFaucetCommand(deps),
});

export type TestnetTokenCommands = ReturnType<typeof createTestnetTokenCommands>;
