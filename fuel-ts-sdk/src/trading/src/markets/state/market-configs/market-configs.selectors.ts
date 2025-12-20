import type { RootState } from '@/shared/lib/redux';
import type { AssetId } from '@/shared/types';

import type { MarketConfig } from '../../domain';

export const selectMarketConfigsState = (state: RootState) =>
  state.trading.markets.marketConfigs;

export const selectMarketConfig =
  (assetId: AssetId) =>
  (state: RootState): MarketConfig | undefined =>
    selectMarketConfigsState(state).data[assetId];

export const selectAllMarketConfigs = (state: RootState): Record<AssetId, MarketConfig> =>
  selectMarketConfigsState(state).data;

export const selectMarketConfigsFetchStatus = (state: RootState) =>
  selectMarketConfigsState(state).fetchStatus;

export const selectMarketConfigsError = (state: RootState) =>
  selectMarketConfigsState(state).error;
