import type { StoreService } from '@/shared/lib/store-service';
import type { PositionId } from '@/shared/types';
import { selectPositionById } from '../../infrastructure';

export const createGetPositionById = (storeService: StoreService) => (positionId: PositionId) =>
  selectPositionById(storeService.getState(), positionId);
