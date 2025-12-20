import type { AssetId } from '@/shared/types';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { MarketConfig } from '../../domain';
import { marketConfigsInitialState, type MarketConfigsState } from './market-configs.types';

export function updateMarketConfig(
  state: MarketConfigsState,
  action: PayloadAction<{ assetId: AssetId; config: MarketConfig }>
) {
  state.data[action.payload.assetId] = action.payload.config;
}

export function clearMarketConfigs() {
  return marketConfigsInitialState;
}
