import type { LoadableState } from '@/shared/lib/redux';
import type { AssetId } from '@/shared/types';

import type { MarketConfig } from '../../domain';

export type MarketConfigsState = LoadableState<Record<AssetId, MarketConfig>>;

export const marketConfigsInitialState: MarketConfigsState = {
  data: {},
  fetchStatus: 'idle',
  error: null,
};
