import { createEntityAdapter } from '@reduxjs/toolkit';
import type { LoadableMixin } from '@/shared/lib/redux';
import type { MarketConfigId } from '@/shared/types';
import type { MarketConfigEntity } from '../../../domain';

export const marketConfigsAdapter = createEntityAdapter<MarketConfigEntity, MarketConfigId>({
  selectId: (marketConfig) => marketConfig.id,
  sortComparer: (a, b) => a.asset.localeCompare(b.asset),
});

export const marketConfigsInitialState = marketConfigsAdapter.getInitialState<LoadableMixin>({
  fetchStatus: 'uninitialized',
  error: null,
});

export type MarketConfigsState = typeof marketConfigsInitialState;
