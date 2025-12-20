import type { RootState } from '@/shared/lib/redux';
import type { Address } from '@/shared/types';

import type { Position } from '../../domain';

export const selectPositionsState = (state: RootState) => state.trading.positions;

export const selectPositionsByAccount =
  (account: Address) =>
  (state: RootState): Position[] | undefined =>
    selectPositionsState(state).data[account];

export const selectAllPositions = (state: RootState): Record<Address, Position[]> =>
  selectPositionsState(state).data;

export const selectPositionsFetchStatus = (state: RootState) =>
  selectPositionsState(state).fetchStatus;

export const selectPositionsError = (state: RootState) => selectPositionsState(state).error;
