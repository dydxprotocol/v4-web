import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';
import type { RootState } from '@/shared/lib/redux';
import type { AssetId } from '@/shared/types';
import { marketConfigsAdapter } from './market-configs.types';

const selectMarketConfigsState = (state: RootState) => state.trading.markets.marketConfigs;

const selectors = marketConfigsAdapter.getSelectors(selectMarketConfigsState);

export const selectAllMarketConfigs = selectors.selectAll;

export const selectMarketConfigsFetchStatus = createSelector(
  [selectMarketConfigsState],
  (state) => state.fetchStatus
);

export const selectMarketConfigsError = createSelector(
  [selectMarketConfigsState],
  (state) => state.error
);

export const selectMarketConfigByAsset = memoize((asset: AssetId) =>
  createSelector(
    [selectAllMarketConfigs],
    (configs) => configs.find((c) => c.asset === asset)
  )
);
