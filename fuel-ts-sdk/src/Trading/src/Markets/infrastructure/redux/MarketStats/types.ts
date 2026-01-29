import { createEntityAdapter } from '@reduxjs/toolkit';
import type { LoadableMixin } from '@sdk/shared/lib/redux';
import type { AssetId } from '@sdk/shared/types';
import type { MarketStatsEntity } from '../../../domain';

export const marketStatsEntityAdapter = createEntityAdapter<MarketStatsEntity, AssetId>({
  selectId: (marketStats) => marketStats.assetId,
});

export const nullMarketStatsState = marketStatsEntityAdapter.getInitialState<LoadableMixin>({
  error: undefined,
  fetchStatus: 'uninitialized',
});

export type MarketStatsState = typeof nullMarketStatsState;
