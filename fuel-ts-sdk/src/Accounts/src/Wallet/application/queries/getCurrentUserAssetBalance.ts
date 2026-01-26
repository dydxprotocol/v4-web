import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import type { AssetId } from '@sdk/shared/types';
import { selectCurrentUserState } from '../../infrastructure';

export interface GetCurrentUserAssetBalanceQueryDependencies {
  storeService: StoreService;
}

export const createGetCurrentUserAssetBalanceQuery =
  (deps: GetCurrentUserAssetBalanceQueryDependencies) =>
  (assetId: AssetId | null | undefined): DecimalValueInstance | undefined =>
    assetId ? deps.storeService.select(selectCurrentUserState).data?.balances[assetId] : undefined;
