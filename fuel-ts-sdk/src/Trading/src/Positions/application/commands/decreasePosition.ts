import type { ContractsService } from '@sdk/Accounts';
import { UserBalancesChangedEvent } from '@sdk/shared/events/UserBalancesChanged';
import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { PositionStableId } from '@sdk/shared/types';
import { PositionSide } from '../../domain';
import type { PositionSize } from '../../domain/positionsDecimals';
import { selectLatestPositionByStableId } from '../../infrastructure';

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

    const position = selectLatestPositionByStableId(deps.storeService.getState(), positionId);

    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    const isFullClose = sizeDelta.value === position.size.value;
    const collateralDelta = isFullClose ? position.collateral.value : '0';

    const vault = await deps.contractsService.getVaultContract();
    const account = await deps.contractsService.getB256Account();

    const { waitForResult } = await vault.functions
      .decrease_position(
        account,
        position.assetId,
        collateralDelta,
        sizeDelta.value.toString(),
        position.side === PositionSide.LONG,
        account
      )
      .call();

    await waitForResult();
    deps.storeService.dispatch(UserBalancesChangedEvent());
  };
