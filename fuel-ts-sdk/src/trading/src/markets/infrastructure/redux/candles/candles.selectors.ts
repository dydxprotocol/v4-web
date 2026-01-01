import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';
import type { RootState } from '@/shared/lib/redux';
import { type AssetId } from '@/shared/types';
import type { CandleInterval } from '../../../domain';
import { candlesApi } from './candles.api';

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
