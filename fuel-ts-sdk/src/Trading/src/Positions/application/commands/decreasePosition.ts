import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { ContractId, PositionStableId } from '@sdk/shared/types';
import { vaultAbi } from '@starboard/indexer/abis';
import type { Account } from 'fuels';
import { Contract } from 'fuels';
import type { PositionSize } from '../../domain/positionsDecimals';
import { selectLatestPositionByKeyId } from '../../infrastructure';

export interface DecreasePositionParams {
  positionId: PositionStableId;
  wallet: Account;
  vaultContractAddress: ContractId;
  sizeDelta: PositionSize;
}

export const createDecreasePositionCommand =
  (storeService: StoreService) => async (params: DecreasePositionParams) => {
    const { positionId, wallet, vaultContractAddress, sizeDelta } = params;

    const position = selectLatestPositionByKeyId(storeService.getState(), positionId);

    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    const isFullClose = sizeDelta.value === position.size.value;
    const collateralDelta = isFullClose ? position.collateralAmount.value : '0';

    const vault = new Contract(vaultContractAddress, vaultAbi, wallet);
    const account = { Address: { bits: wallet.address.toB256() } };

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
