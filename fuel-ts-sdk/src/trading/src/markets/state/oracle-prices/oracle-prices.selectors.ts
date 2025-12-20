import type { RootState } from '@/shared/lib/redux';
import type { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';

export const selectOraclePricesState = (state: RootState) => state.trading.markets.oraclePrices;

export const selectOraclePrice =
  (assetId: AssetId) =>
  (state: RootState): OraclePrice | undefined =>
    selectOraclePricesState(state).data[assetId];

export const selectAllOraclePrices = (state: RootState): Record<AssetId, OraclePrice> =>
  selectOraclePricesState(state).data;

export const selectOraclePricesFetchStatus = (state: RootState) =>
  selectOraclePricesState(state).fetchStatus;

export const selectOraclePricesError = (state: RootState) => selectOraclePricesState(state).error;
