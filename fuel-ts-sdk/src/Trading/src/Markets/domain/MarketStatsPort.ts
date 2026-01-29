import type { AssetId } from '@sdk/shared/types';
import type { MarketStatsEntity } from './MarketStats';

export interface MarketStatsRepository {
  getMarketStatsByAssetId(assetId: AssetId): Promise<MarketStatsEntity | undefined>;
}
