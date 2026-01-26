import type { GetCurrentUserAddressQueryDependencies } from './getCurrentUserAddress';
import { createGetCurrentUserAddressQuery } from './getCurrentUserAddress';
import type { GetCurrentUserAssetBalanceQueryDependencies } from './getCurrentUserAssetBalance';
import { createGetCurrentUserAssetBalanceQuery } from './getCurrentUserAssetBalance';
import type { GetCurrentUserBalancesQueryDependencies } from './getCurrentUserBalances';
import { createGetCurrentUserBalancesQuery } from './getCurrentUserBalances';
import { createGetCurrentUserDataFetchStatusQuery } from './getCurrentUserDataFetchStatus';

export type WalletQueriesDeps = GetCurrentUserAddressQueryDependencies &
  GetCurrentUserBalancesQueryDependencies &
  GetCurrentUserAssetBalanceQueryDependencies;

export const createWalletQueries = (deps: WalletQueriesDeps) => ({
  getCurrentUserBalances: createGetCurrentUserBalancesQuery(deps),
  getCurrentUserAssetBalance: createGetCurrentUserAssetBalanceQuery(deps),
  getCurrentUserAddress: createGetCurrentUserAddressQuery(deps),
  getCurrentUserDataFetchStatus: createGetCurrentUserDataFetchStatusQuery(deps),
});

export type WalletQueries = ReturnType<typeof createWalletQueries>;
