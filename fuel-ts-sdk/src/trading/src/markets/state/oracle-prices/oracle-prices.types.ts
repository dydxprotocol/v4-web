import type { LoadableState } from '@/shared/lib/redux';
import type { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';

export type OraclePricesState = LoadableState<Record<AssetId, OraclePrice>>;

export const oraclePricesInitialState: OraclePricesState = {
  data: {},
  fetchStatus: 'idle',
  error: null,
};
