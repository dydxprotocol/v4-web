import type { StoreService } from '@/shared/lib/store-service';
import type { Address } from '@/shared/types';
import type { Position } from '../../domain';
import { selectPositionsByAccount } from '../../infrastructure';

export const createGetAccountPositions =
  (storeService: StoreService) =>
  (address?: Address): Position[] =>
    selectPositionsByAccount(storeService.getState(), address);
