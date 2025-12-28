import type { OraclePrice } from '@/shared/models/decimals';
import type { DecimalValue } from '@/shared/models/decimalValue';
import type { AssetId, AssetPriceId } from '@/shared/types';

export interface AssetPrice {
  id: AssetPriceId;
  assetId: AssetId;
  value: DecimalValue<OraclePrice>;
  timestamp: number;
}