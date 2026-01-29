import { createAction } from '@reduxjs/toolkit';

export interface LiquidityRemovedPayload {
  lpAmount: string;
  baseAssetAmount: string;
}

export const LiquidityRemovedEvent = createAction<LiquidityRemovedPayload>(
  'contracts/vault/LiquidityRemoved'
);
