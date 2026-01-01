import type { StoreService } from '@/shared/lib/store-service';
import type { Address } from '@/shared/types';
import type { Position } from '../../domain';
import { selectLatestPositionsByAccount } from '../../infrastructure';

export const createGetAccountPositions =
  (storeService: StoreService) =>
  (address: Address): Position[] =>
    selectLatestPositionsByAccount(storeService.getState(), address);
