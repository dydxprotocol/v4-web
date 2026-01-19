import type { Address } from '@sdk/shared/types';
import type { MarketQueries } from '../../Markets';
import type { PositionsQueries } from '../../Positions';
import { isPositionOpen } from '../../Positions';

export interface GetAccountOpenPositionsDeps {
  marketQueries: MarketQueries;
  positionsQueries: PositionsQueries;
}

export const createGetAccountOpenPositions =
  (deps: GetAccountOpenPositionsDeps) => (accountAddress?: Address) => {
    const userPositions = deps.positionsQueries.getAccountPositions(accountAddress);

    return userPositions.filter((p) => isPositionOpen(p));
  };
