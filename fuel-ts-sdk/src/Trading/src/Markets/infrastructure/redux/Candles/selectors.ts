import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';
import type { RootState } from '@sdk/shared/lib/redux';
import { type AssetId } from '@sdk/shared/types';
import type { CandleInterval } from '../../../domain';
import { candlesApi } from './api';

const selectGetCandlesEndpointState = memoize(
  (state: RootState, asset: AssetId, interval: CandleInterval, limit = 100) =>
    candlesApi.endpoints.getCandles.select({ asset, interval, limit })(state)
);

export const selectCandlesByAssetAndInterval = createSelector(
  [selectGetCandlesEndpointState],
  (state) => state.data ?? []
);
export const selectCandlesFetchStatus = createSelector(
  [selectGetCandlesEndpointState],
  (state) => state.status
);
