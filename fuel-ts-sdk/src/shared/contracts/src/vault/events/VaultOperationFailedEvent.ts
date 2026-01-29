import { createAction } from '@reduxjs/toolkit';

export type VaultOperation =
  | 'increase_position'
  | 'decrease_position'
  | 'add_liquidity'
  | 'remove_liquidity';

export interface VaultOperationFailedPayload {
  operation: VaultOperation;
  error: string;
}

export const VaultOperationFailedEvent = createAction<VaultOperationFailedPayload>(
  'contracts/vault/OperationFailed'
);
