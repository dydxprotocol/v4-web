import type { RootState } from '@/shared/lib/redux';
import type { Address } from '@/shared/types';
import type { Position } from '../../../domain';
import { positionsAdapter } from './positions.types';

export const selectPositionsState = (state: RootState) => state.trading.positions;

const adapterSelectors = positionsAdapter.getSelectors(selectPositionsState);

export const selectAllPositions = adapterSelectors.selectAll;
export const selectPositionById = adapterSelectors.selectById;
export const selectPositionIds = adapterSelectors.selectIds;
export const selectPositionEntities = adapterSelectors.selectEntities;

export const selectPositionsByAccount =
  (account: Address) =>
  (state: RootState): Position[] =>
    selectAllPositions(state).filter((p) => p.positionKey.account === account);

export const selectPositionsFetchStatus = (state: RootState) =>
  selectPositionsState(state).fetchStatus;

export const selectPositionsError = (state: RootState) => selectPositionsState(state).error;
