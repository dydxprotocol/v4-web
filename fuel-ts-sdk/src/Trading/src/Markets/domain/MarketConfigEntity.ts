import type { PercentageValue } from '@/shared/models/decimals';
import type { AssetId, MarketConfigId } from '@/shared/types';

/**
 * MarketConfig - Configuration parameters for a market
 */
export interface MarketConfigEntity {
  id: MarketConfigId;
  asset: AssetId;
  initialMarginFraction: PercentageValue;
  maintenanceMarginFraction: PercentageValue;
  tickSizeDecimals: number;
  stepSizeDecimals: number;
}
