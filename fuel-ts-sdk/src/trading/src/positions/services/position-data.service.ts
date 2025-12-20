import type { StoreService } from '@/shared/lib/store-service';
import type { Address } from '@/shared/types';

import type { Position } from '../domain';
import * as positionsState from '../state/positions';

export const createPositionDataService = (storeService: StoreService) => ({
  getPositionsByAccount: storeService.withRequiredData(
    (account: Address): Position[] => {
      const positions = storeService.select(
        positionsState.selectors.selectPositionsByAccount(account)
      );
      if (!positions) {
        throw new Error(`Positions not found for account ${account}`);
      }
      return positions;
    },
    [positionsState.selectors.selectPositionsState]
  ),

  getAllPositions: storeService.withRequiredData(
    (): Record<Address, Position[]> => {
      return storeService.select(positionsState.selectors.selectAllPositions);
    },
    [positionsState.selectors.selectPositionsState]
  ),
});

export type PositionDataService = ReturnType<typeof createPositionDataService>;
