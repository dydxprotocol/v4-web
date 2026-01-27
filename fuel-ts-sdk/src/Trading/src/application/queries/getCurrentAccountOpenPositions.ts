import type { WalletQueries } from '@sdk/Accounts';
import { monomemo } from '@sdk/shared/lib/memo';
import { type PositionsQueries, filterPositionsByAccountAddress } from '../../Positions';

export interface GetAccountOpenPositionsQueryDeps {
  positionsQueries: PositionsQueries;
  walletQueries: WalletQueries;
}
export const createGetCurrentAccountOpenPositionsQuery = (
  deps: GetAccountOpenPositionsQueryDeps
) => {
  const currentUserAddressGetter = deps.walletQueries.getCurrentUserAddress;
  const allPositionsGetter = deps.positionsQueries.getAllLatestPositions;

  const getCurrentAccountOpenPositions = monomemo(
    (
      currentUserAddress: ReturnType<typeof currentUserAddressGetter>,
      allPositions: ReturnType<typeof allPositionsGetter>
    ) => {
      if (!currentUserAddress) return [];

      const userPositions = filterPositionsByAccountAddress(allPositions, currentUserAddress);
      return userPositions.filter((p) => deps.positionsQueries.isPositionOpen(p.stableId));
    }
  );

  return () => getCurrentAccountOpenPositions(currentUserAddressGetter(), allPositionsGetter());
};
