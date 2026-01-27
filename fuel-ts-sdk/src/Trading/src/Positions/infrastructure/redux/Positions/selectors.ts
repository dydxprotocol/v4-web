import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@sdk/shared/lib/redux';
import type { Address, PositionStableId } from '@sdk/shared/types';
import { positionsAdapter } from './slice';

const selectPositionsState = (state: RootState) => state.trading.positions.positions;

const adapterSelectors = positionsAdapter.getSelectors(selectPositionsState);

export const selectAllPositions = adapterSelectors.selectAll;

export const selectPositionById = adapterSelectors.selectById;

export const selectPositionsByAccount = createSelector(
  [selectAllPositions, (_state: RootState, account?: Address) => account],
  (positions, account) => positions.filter((p) => p.accountAddress === account)
);

export const selectPositionsByStableId = createSelector(
  [selectAllPositions, (_state: RootState, keyId?: PositionStableId) => keyId],
  (positions, keyId) => positions.filter((p) => p.stableId === keyId)
);

export const selectLatestPositionByStableId = createSelector(
  [selectAllPositions, (_state: RootState, keyId?: PositionStableId) => keyId],
  (positions, keyId) => positions.find((p) => p.stableId === keyId && p.isLatest)
);

export const selectLatestPositionsByAccount = createSelector(
  [selectAllPositions, (_state: RootState, account?: Address) => account],
  (positions, account) => positions.filter((p) => p.accountAddress === account && p.isLatest)
);
