import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import type { VaultContractPort } from '../../VaultContractPort';
import { LiquidityRemovedEvent, VaultOperationFailedEvent } from '../events';

export interface RemoveLiquidityParams {
  lpAmount: string;
  lpAssetId: AssetId;
}

export interface RemoveLiquidityDependencies {
  vaultContractPort: VaultContractPort;
  storeService: StoreService;
}

export const createRemoveLiquidityCommand =
  (deps: RemoveLiquidityDependencies) =>
  async (params: RemoveLiquidityParams): Promise<void> => {
    const { lpAmount, lpAssetId } = params;

    try {
      const vault = await deps.vaultContractPort.getVaultContract();
      const account = await deps.vaultContractPort.getB256Account();

      if (!account) {
        throw new Error('Wallet is not connected');
      }

      const { waitForResult } = await vault.functions
        .remove_liquidity(account)
        .callParams({
          forward: {
            amount: lpAmount,
            assetId: lpAssetId,
          },
        })
        .call();

      const result = await waitForResult();
      const baseAssetAmount = result.value?.toString() ?? '0';

      deps.storeService.dispatch(
        LiquidityRemovedEvent({
          lpAmount,
          baseAssetAmount,
        })
      );
    } catch (error) {
      deps.storeService.dispatch(
        VaultOperationFailedEvent({
          operation: 'remove_liquidity',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      throw error;
    }
  };
