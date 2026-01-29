import type { VaultCommands } from '@sdk/shared/contracts';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import type { CollateralAmount } from '@sdk/shared/models/decimals';
import type { AssetId } from '@sdk/shared/types';

export interface SubmitOrderParams {
  isLong: boolean;
  indexAsset: AssetId;
  collateralAssetId: AssetId;
  leverage: DecimalValueInstance;
  collateralAmount: CollateralAmount;
}

export interface SubmitOrderDependencies {
  vaultCommands: VaultCommands;
}

export const createSubmitOrder =
  (deps: SubmitOrderDependencies) => async (params: SubmitOrderParams) => {
    await deps.vaultCommands.increasePosition(params);
  };
