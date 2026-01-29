import { createAction } from '@reduxjs/toolkit';
import type { AssetId } from '@sdk/shared/types';

export interface PositionDecreasedPayload {
  indexAsset: AssetId;
  isLong: boolean;
  isFullClose: boolean;
}

export const PositionDecreasedEvent = createAction<PositionDecreasedPayload>(
  'contracts/vault/PositionDecreased'
);
