import type { ContractsService } from '@sdk/Accounts';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import { CollateralAmount } from '@sdk/shared/models/decimals';
import type { AssetId } from '@sdk/shared/types';
import { DecimalCalculator } from '@sdk/shared/utils/DecimalCalculator';

export interface SubmitOrderParams {
  isLong: boolean;
  indexAsset: AssetId;
  collateralAssetId: AssetId;
  leverage: DecimalValueInstance;
  collateralAmount: CollateralAmount;
}

export interface SubmitOrderDependencies {
  contractsService: ContractsService;
}

export const createSubmitOrder =
  (deps: SubmitOrderDependencies) => async (params: SubmitOrderParams) => {
    const { indexAsset, leverage, isLong, collateralAmount, collateralAssetId } = params;

    const vault = await deps.contractsService.getVaultContract();

    const size = DecimalCalculator.value(collateralAmount)
      .multiplyBy(leverage)
      .calculate(CollateralAmount)
      .value.toString();

    const account = await deps.contractsService.getB256Account();
    if (!account) {
      throw new Error('Wallet is not connected');
    }

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
