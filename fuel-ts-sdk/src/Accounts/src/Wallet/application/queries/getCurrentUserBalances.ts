import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { WalletBalancesEntity } from '../../domain';
import { selectCurrentUserState } from '../../infrastructure';

export interface GetCurrentUserBalancesQueryDependencies {
  storeService: StoreService;
}

export const createGetCurrentUserBalancesQuery =
  (deps: GetCurrentUserBalancesQueryDependencies) => (): WalletBalancesEntity | undefined =>
    deps.storeService.select(selectCurrentUserState).data?.balances;
