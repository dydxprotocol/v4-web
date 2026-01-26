import type { FetchCurrentUserDataCommandDependencies } from './fetchCurrentUserData';
import { createFetchCurrentUserDataCommand } from './fetchCurrentUserData';
import type { InvalidateCurrentUserDataCommandDependencies } from './invalidateCurrentUserData';
import { createInvalidateCurrentUserDataCommand } from './invalidateCurrentUserData';

export type WalletCommandsDeps = FetchCurrentUserDataCommandDependencies &
  InvalidateCurrentUserDataCommandDependencies;

export const createWalletCommands = (deps: WalletCommandsDeps) => ({
  fetchCurrentUserData: createFetchCurrentUserDataCommand(deps),
  invalidateCurrentUserData: createInvalidateCurrentUserDataCommand(deps),
});

export type WalletCommands = ReturnType<typeof createWalletCommands>;
