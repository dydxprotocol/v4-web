import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { VaultContractPort } from '../../VaultContractPort';
import { LiquidityAddedEvent, VaultOperationFailedEvent } from '../events';

export interface AddLiquidityParams {
  baseAssetAmount: string;
  baseAssetId: AssetId;
}

export interface AddLiquidityDependencies {
  vaultContractPort: VaultContractPort;
  storeService: StoreService;
}

export const createAddLiquidityCommand =
  (deps: AddLiquidityDependencies) =>
  async (params: AddLiquidityParams): Promise<void> => {
    const { baseAssetAmount, baseAssetId } = params;

    try {
      const vault = await deps.vaultContractPort.getVaultContract();
      const account = await deps.vaultContractPort.getB256Account();

      if (!account) {
        throw new Error('Wallet is not connected');
      }

      const { waitForResult } = await vault.functions
        .add_liquidity(account)
        .callParams({
          forward: {
            amount: baseAssetAmount,
            assetId: baseAssetId,
          },
        })
        .call();

      const result = await waitForResult();
      const lpAmount = result.value?.toString() ?? '0';

      deps.storeService.dispatch(
        LiquidityAddedEvent({
          lpAmount,
          baseAssetAmount,
        })
      );
    } catch (error) {
      deps.storeService.dispatch(
        VaultOperationFailedEvent({
          operation: 'add_liquidity',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      throw error;
    }
  };
