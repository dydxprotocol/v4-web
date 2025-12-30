import type { OraclePrice } from '@/shared/models/decimals';
import type { AssetId, AssetPriceId } from '@/shared/types';

export interface AssetPrice {
  id: AssetPriceId;
  assetId: AssetId;
  value: OraclePrice;
  timestamp: number;
}
