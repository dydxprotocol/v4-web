import { createEntityAdapter } from '@reduxjs/toolkit';
import { LoadableMixin } from '@/shared/lib/redux';
import type { MarketConfigId } from '@/shared/types';
import type { MarketConfig } from '../../domain';

export const marketConfigsAdapter = createEntityAdapter<MarketConfig, MarketConfigId>({
  selectId: (marketConfig) => marketConfig.id,
  sortComparer: (a, b) => a.asset.localeCompare(b.asset),
});

export const marketConfigsInitialState = marketConfigsAdapter.getInitialState<LoadableMixin>({
  fetchStatus: 'idle',
  error: null,
});

export type MarketConfigsState = typeof marketConfigsInitialState;
