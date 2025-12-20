import type { Address } from '@/shared/types';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Position } from '../../domain';
import { positionsInitialState, type PositionsState } from './positions.types';

export function updatePositions(
  state: PositionsState,
  action: PayloadAction<{ account: Address; positions: Position[] }>
) {
  state.data[action.payload.account] = action.payload.positions;
}

export function clearPositions() {
  return positionsInitialState;
}
