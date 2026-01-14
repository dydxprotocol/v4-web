import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/lib/redux';
import { type AssetId } from '@/shared/types';
import { marketConfigsAdapter } from './types';

export const selectMarketConfigsState = (state: RootState) => state.markets.marketConfigs;

const selectors = marketConfigsAdapter.getSelectors(selectMarketConfigsState);

export const selectAllMarketConfigs = selectors.selectAll;

export const selectMarketConfigById = selectors.selectById;

export const selectMarketConfigsFetchStatus = createSelector(
  [selectMarketConfigsState],
  (state) => state.fetchStatus
);

export const selectMarketConfigsError = createSelector(
  [selectMarketConfigsState],
  (state) => state.error
);

export const selectMarketConfigByAsset = createSelector(
  [(_, assetId: AssetId) => assetId, selectAllMarketConfigs],
  (assetId, configs) => configs.find((c) => c.asset === assetId)
);
