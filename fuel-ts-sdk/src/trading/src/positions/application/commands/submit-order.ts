import type { Account, JsonAbi } from 'fuels';
import { Contract } from 'fuels';
import type { CollateralAmount } from '@/shared/models/decimals';
import type { AssetId, ContractId } from '@/shared/types';
import type { PositionSize } from '../../domain/positions.decimals';

export interface SubmitOrderParams {
  isLong: boolean;
  wallet: Account;
  indexAsset: AssetId;
  collateralAssetId: AssetId;
  vaultContractAddress: ContractId;
  sizeDelta: PositionSize;
  collateralAmount: CollateralAmount;
}

export const createSubmitOrder = () => async (params: SubmitOrderParams) => {
  const {
    wallet,
    vaultContractAddress,
    indexAsset,
    sizeDelta,
    isLong,
    collateralAmount,
    collateralAssetId,
  } = params;

  const vault = new Contract(vaultContractAddress, {} as JsonAbi, wallet);

  const account = { Address: { bits: wallet.address.toB256() } };

  return vault.functions
    .increase_position(account, indexAsset, sizeDelta.value, isLong)
    .callParams({
      forward: {
        amount: collateralAmount.value.toString(),
        assetId: collateralAssetId,
      },
    })
    .call();
};
