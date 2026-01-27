import type { StoreService } from '@sdk/shared/lib/StoreService';
import { multimemo } from '@sdk/shared/lib/memo';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import type { AssetId } from '@sdk/shared/types';
import { zero } from '@sdk/shared/utils/DecimalCalculator';
import { selectCurrentUserState } from '../../infrastructure';

export interface GetCurrentUserAssetBalanceQueryDependencies {
  storeService: StoreService;
}

export const createGetCurrentUserAssetBalanceQuery = (
  deps: GetCurrentUserAssetBalanceQueryDependencies
) => {
  const userBalancesGetter = () => deps.storeService.select(selectCurrentUserState).data?.balances;

  const memoized = multimemo(
    (
      assetId: AssetId | null | undefined,
      userBalances: ReturnType<typeof userBalancesGetter>
    ): DecimalValueInstance => {
      if (!assetId) return zero();

      const assetBalance = userBalances?.[assetId];
      if (!assetBalance) return zero();

      return assetBalance;
    }
  );

  return (assetId: AssetId | null | undefined) => memoized(assetId, userBalancesGetter());
};
