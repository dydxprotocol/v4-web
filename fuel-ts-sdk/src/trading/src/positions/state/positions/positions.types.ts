import { createEntityAdapter } from '@reduxjs/toolkit';
import { LoadableMixin } from '@/shared/lib/redux';
import type { PositionId } from '@/shared/types';
import type { Position } from '../../domain';

export const positionsAdapter = createEntityAdapter<Position, PositionId>({
  selectId: (position) => position.id,
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

export const positionsInitialState = positionsAdapter.getInitialState<LoadableMixin>({
  fetchStatus: 'idle',
  error: null,
});

export type PositionsState = typeof positionsInitialState;
