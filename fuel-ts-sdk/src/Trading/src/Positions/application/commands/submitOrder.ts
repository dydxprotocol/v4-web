import type { SdkConfig } from '@sdk/shared/lib/SdkConfig';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import { CollateralAmount } from '@sdk/shared/models/decimals';
import type { AssetId } from '@sdk/shared/types';
import { DecimalCalculator } from '@sdk/shared/utils/DecimalCalculator';
import { vaultAbi } from '@starboard/indexer/abis';
import type { Account } from 'fuels';
import { Contract } from 'fuels';

export interface SubmitOrderParams {
  isLong: boolean;
  wallet: Account;
  indexAsset: AssetId;
  collateralAssetId: AssetId;
  leverage: DecimalValueInstance;
  collateralAmount: CollateralAmount;
}

export const createSubmitOrder = (sdkConfig: SdkConfig) => async (params: SubmitOrderParams) => {
  const { wallet, indexAsset, leverage, isLong, collateralAmount, collateralAssetId } = params;

  const vault = new Contract(sdkConfig.vaultAddress, vaultAbi, wallet);

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
