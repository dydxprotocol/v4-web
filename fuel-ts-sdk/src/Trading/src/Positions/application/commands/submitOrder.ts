import { vaultAbi } from '@starboard/indexer/abis';
import type { Account } from 'fuels';
import { Contract } from 'fuels';
import type { DecimalValueInstance } from '@/shared/models/DecimalValue';
import { CollateralAmount } from '@/shared/models/decimals';
import type { AssetId, ContractId } from '@/shared/types';
import { DecimalCalculator } from '@/shared/utils/DecimalCalculator';

export interface SubmitOrderParams {
  isLong: boolean;
  wallet: Account;
  indexAsset: AssetId;
  collateralAssetId: AssetId;
  vaultContractAddress: ContractId;
  leverage: DecimalValueInstance;
  collateralAmount: CollateralAmount;
}

export const createSubmitOrder = () => async (params: SubmitOrderParams) => {
  const {
    wallet,
    vaultContractAddress,
    indexAsset,
    leverage,
    isLong,
    collateralAmount,
    collateralAssetId,
  } = params;

  const vault = new Contract(vaultContractAddress, vaultAbi, wallet);

  const size = DecimalCalculator.value(collateralAmount)
    .multiplyBy(leverage)
    .calculate(CollateralAmount)
    .value.toString();

  const account = { Address: { bits: wallet.address.toB256() } };

  return vault.functions
    .increase_position(account, indexAsset, size, isLong)
    .callParams({
      forward: {
        amount: collateralAmount.value.toString(),
        assetId: collateralAssetId,
      },
    })
    .call();
};
