import { createAction } from '@reduxjs/toolkit';
import type { AssetId } from '@sdk/shared/types';

export interface PositionIncreasedPayload {
  indexAsset: AssetId;
  isLong: boolean;
}

export const PositionIncreasedEvent = createAction<PositionIncreasedPayload>(
  'contracts/vault/PositionIncreased'
);
