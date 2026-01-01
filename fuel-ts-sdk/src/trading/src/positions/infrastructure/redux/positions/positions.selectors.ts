import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';
import type { RootState } from '@/shared/lib/redux';
import type { Address } from '@/shared/types';
import { positionsApi } from './positions.api';

const selectGetPositionsEndpointState = memoize((state: RootState, address: Address) =>
  positionsApi.endpoints.getPositions.select({ address })(state)
);

export const selectAllPositionsByAddress = createSelector(
  [selectGetPositionsEndpointState],
  (state) => state.data ?? []
);

export const selectPositionsFetchStatus = createSelector(
  [selectGetPositionsEndpointState],
  (state) => state.status
);
