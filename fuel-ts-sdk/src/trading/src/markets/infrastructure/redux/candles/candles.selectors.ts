import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';
import type { RootState } from '@/shared/lib/redux';
import type { AssetId } from '@/shared/types';
import type { CandleInterval } from '../../../domain';
import { candlesAdapter } from './candles.types';

const selectCandlesState = (state: RootState) => state.trading.markets.candles;

const selectors = candlesAdapter.getSelectors(selectCandlesState);

export const selectAllCandles = selectors.selectAll;

export const selectCandlesFetchStatus = createSelector(
  [selectCandlesState],
  (state) => state.fetchStatus
);

export const selectCandlesError = createSelector([selectCandlesState], (state) => state.error);

export const selectCandlesByAssetAndInterval = memoize((asset: AssetId, interval: CandleInterval) =>
  createSelector(
    [selectAllCandles],
    (candles) => candles.filter((c) => c.asset === asset && c.interval === interval) ?? []
  )
);
