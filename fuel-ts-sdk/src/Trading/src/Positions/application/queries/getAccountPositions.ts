import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { Address } from '@sdk/shared/types';
import type { PositionEntity } from '../../domain';
import { selectLatestPositionsByAccount } from '../../infrastructure';

export const createGetAccountWatchedAssetPositions =
  (storeService: StoreService) =>
  (address?: Address): PositionEntity[] =>
    selectLatestPositionsByAccount(storeService.getState(), address);
