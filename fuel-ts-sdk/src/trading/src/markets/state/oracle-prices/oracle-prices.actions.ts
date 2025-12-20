import type { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { OraclePricesState } from './oracle-prices.types';

export function updateOraclePrice(
  state: OraclePricesState,
  action: PayloadAction<{ assetId: AssetId; price: OraclePrice }>
) {
  state.data[action.payload.assetId] = action.payload.price;
}

export function clearOraclePrices(state: OraclePricesState) {
  state.data = {};
  state.fetchStatus = 'idle';
  state.error = null;
}
