import type { ContractsService } from '@sdk/Accounts';
import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { PositionStableId } from '@sdk/shared/types';
import type { PositionSize } from '../../domain/positionsDecimals';
import { selectLatestPositionByKeyId } from '../../infrastructure';

export interface DecreasePositionDependencies {
  contractsService: ContractsService;
  storeService: StoreService;
}

export interface DecreasePositionParams {
  positionId: PositionStableId;
  sizeDelta: PositionSize;
}

export const createDecreasePositionCommand =
  (deps: DecreasePositionDependencies) => async (params: DecreasePositionParams) => {
    const { positionId, sizeDelta } = params;

    const position = selectLatestPositionByKeyId(deps.storeService.getState(), positionId);

    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    const isFullClose = sizeDelta.value === position.size.value;
    const collateralDelta = isFullClose ? position.collateralAmount.value : '0';

    const vault = await deps.contractsService.getVaultContract();
    const account = await deps.contractsService.getB256Account();

    await vault.functions
      .decrease_position(
        account,
        position.positionKey.indexAssetId,
        collateralDelta,
        sizeDelta.value.toString(),
        position.positionKey.isLong,
        account
      )
      .call();
  };
