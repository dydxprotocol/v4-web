import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/lib/redux';
import type { Address, PositionStableId } from '@/shared/types';
import { positionsAdapter } from './positions.slice';

const selectPositionsState = (state: RootState) => state.trading.positions;

const adapterSelectors = positionsAdapter.getSelectors(selectPositionsState);

export const selectAllPositions = adapterSelectors.selectAll;

export const selectPositionById = adapterSelectors.selectById;

export const selectPositionsByAccount = createSelector(
  [selectAllPositions, (_state: RootState, account: Address) => account],
  (positions, account) => positions.filter((p) => p.positionKey.account === account)
);

export const selectPositionsByKeyId = createSelector(
  [selectAllPositions, (_state: RootState, keyId: PositionStableId) => keyId],
  (positions, keyId) => positions.filter((p) => p.positionKey.id === keyId)
);

export const selectLatestPositionByKeyId = createSelector(
  [selectAllPositions, (_state: RootState, keyId: PositionStableId) => keyId],
  (positions, keyId) => positions.filter((p) => p.positionKey.id === keyId).find((p) => p.latest)
);

export const selectLatestPositionsByAccount = createSelector(
  [selectAllPositions, (_state: RootState, account: Address) => account],
  (positions, account) => positions.filter((p) => p.positionKey.account === account && p.latest)
);
