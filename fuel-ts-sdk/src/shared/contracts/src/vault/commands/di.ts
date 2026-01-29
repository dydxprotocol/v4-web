import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { VaultContractPort } from '../../VaultContractPort';
import { createAddLiquidityCommand } from './addLiquidity';
import { createDecreasePositionCommand } from './decreasePosition';
import { createIncreasePositionCommand } from './increasePosition';
import { createRemoveLiquidityCommand } from './removeLiquidity';

export interface VaultCommandsDependencies {
  vaultContractPort: VaultContractPort;
  storeService: StoreService;
}

export const createVaultCommands = (deps: VaultCommandsDependencies) => ({
  increasePosition: createIncreasePositionCommand(deps),
  decreasePosition: createDecreasePositionCommand(deps),
  addLiquidity: createAddLiquidityCommand(deps),
  removeLiquidity: createRemoveLiquidityCommand(deps),
});

export type VaultCommands = ReturnType<typeof createVaultCommands>;
