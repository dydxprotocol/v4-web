import type { OraclePrice } from '@sdk/shared/models/decimals';
import type { AssetId, AssetPriceId } from '@sdk/shared/types';

export interface AssetPriceEntity {
  id: AssetPriceId;
  assetId: AssetId;
  value: OraclePrice;
  timestamp: number;
}
