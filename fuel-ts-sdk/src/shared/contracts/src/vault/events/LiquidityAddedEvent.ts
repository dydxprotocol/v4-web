import { createAction } from '@reduxjs/toolkit';

export interface LiquidityAddedPayload {
  lpAmount: string;
  baseAssetAmount: string;
}

export const LiquidityAddedEvent = createAction<LiquidityAddedPayload>(
  'contracts/vault/LiquidityAdded'
);
