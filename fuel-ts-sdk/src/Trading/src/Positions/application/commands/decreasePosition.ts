import type { VaultCommands } from '@sdk/shared/contracts';
import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { PositionStableId } from '@sdk/shared/types';
import { PositionSide } from '../../domain';
import type { PositionSize } from '../../domain/positionsDecimals';
import { selectLatestPositionByStableId } from '../../infrastructure';

export interface DecreasePositionDependencies {
  vaultCommands: VaultCommands;
  storeService: StoreService;
}

export interface DecreasePositionParams {
  positionId: PositionStableId;
  sizeDelta: PositionSize;
}

export const createDecreasePositionCommand =
  (deps: DecreasePositionDependencies) => async (params: DecreasePositionParams) => {
    const { positionId, sizeDelta } = params;

    const position = selectLatestPositionByStableId(deps.storeService.getState(), positionId);

    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    const isFullClose = sizeDelta.value === position.size.value;
    const collateralDelta = isFullClose ? position.collateral.value : '0';

    await deps.vaultCommands.decreasePosition({
      indexAsset: position.assetId,
      collateralDelta,
      sizeDelta: sizeDelta.value.toString(),
      isLong: position.side === PositionSide.LONG,
      isFullClose,
    });
  };
