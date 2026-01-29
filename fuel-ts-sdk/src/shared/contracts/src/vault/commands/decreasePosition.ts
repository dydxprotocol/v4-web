import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { VaultContractPort } from '../../VaultContractPort';
import { PositionDecreasedEvent, VaultOperationFailedEvent } from '../events';

export interface DecreasePositionParams {
  indexAsset: AssetId;
  collateralDelta: string;
  sizeDelta: string;
  isLong: boolean;
  isFullClose: boolean;
}

export interface DecreasePositionDependencies {
  vaultContractPort: VaultContractPort;
  storeService: StoreService;
}

export const createDecreasePositionCommand =
  (deps: DecreasePositionDependencies) =>
  async (params: DecreasePositionParams): Promise<void> => {
    const { indexAsset, collateralDelta, sizeDelta, isLong, isFullClose } = params;

    try {
      const vault = await deps.vaultContractPort.getVaultContract();
      const account = await deps.vaultContractPort.getB256Account();

      if (!account) {
        throw new Error('Wallet is not connected');
      }

      const { waitForResult } = await vault.functions
        .decrease_position(account, indexAsset, collateralDelta, sizeDelta, isLong, account)
        .call();

      await waitForResult();

      deps.storeService.dispatch(PositionDecreasedEvent({ indexAsset, isLong, isFullClose }));
    } catch (error) {
      deps.storeService.dispatch(
        VaultOperationFailedEvent({
          operation: 'decrease_position',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      throw error;
    }
  };
