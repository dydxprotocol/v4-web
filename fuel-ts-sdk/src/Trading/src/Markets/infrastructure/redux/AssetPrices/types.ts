import { createEntityAdapter } from '@reduxjs/toolkit';
import type { LoadableMixin } from '@/shared/lib/redux';
import type { AssetPriceId } from '@/shared/types';
import type { AssetPriceEntity } from '../../../domain';

export const assetPricesAdapter = createEntityAdapter<AssetPriceEntity, AssetPriceId>({
  selectId: (assetPrice) => assetPrice.id,
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

export const assetPricesInitialState = assetPricesAdapter.getInitialState<LoadableMixin>({
  fetchStatus: 'uninitialized',
  error: null,
});

export type AssetPricesState = typeof assetPricesInitialState;
