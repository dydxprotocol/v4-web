import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import { CollateralAmount } from '@sdk/shared/models/decimals';
import type { AssetId } from '@sdk/shared/types';
import { DecimalCalculator } from '@sdk/shared/utils/DecimalCalculator';
import type { VaultContractPort } from '../../VaultContractPort';
import { PositionIncreasedEvent, VaultOperationFailedEvent } from '../events';

export interface IncreasePositionParams {
  isLong: boolean;
  indexAsset: AssetId;
  collateralAssetId: AssetId;
  leverage: DecimalValueInstance;
  collateralAmount: CollateralAmount;
}

export interface IncreasePositionDependencies {
  vaultContractPort: VaultContractPort;
  storeService: StoreService;
}

export const createIncreasePositionCommand =
  (deps: IncreasePositionDependencies) =>
  async (params: IncreasePositionParams): Promise<void> => {
    const { indexAsset, leverage, isLong, collateralAmount, collateralAssetId } = params;

    try {
      const vault = await deps.vaultContractPort.getVaultContract();
      const account = await deps.vaultContractPort.getB256Account();

      if (!account) {
        throw new Error('Wallet is not connected');
      }

      const size = DecimalCalculator.value(collateralAmount)
        .multiplyBy(leverage)
        .calculate(CollateralAmount)
        .value.toString();

      const { waitForResult } = await vault.functions
        .increase_position(account, indexAsset, size, isLong)
        .callParams({
          forward: {
            amount: collateralAmount.value.toString(),
            assetId: collateralAssetId,
          },
        })
        .call();

      await waitForResult();

      deps.storeService.dispatch(PositionIncreasedEvent({ indexAsset, isLong }));
    } catch (error) {
      deps.storeService.dispatch(
        VaultOperationFailedEvent({
          operation: 'increase_position',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      throw error;
    }
  };
