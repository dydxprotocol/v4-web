import type { StoreService } from '@/shared/lib/store-service';
import type { OraclePrice } from '@/shared/models/decimals';
import type { AssetId } from '@/shared/types';

import * as marketConfigs from '../state/market-configs';
import * as oraclePrices from '../state/oracle-prices';

export const createMarketDataService = (storeService: StoreService) => ({
  getOraclePrice: storeService.withRequiredData(
    (assetId: AssetId) => {
      const price = storeService.select(oraclePrices.selectors.selectOraclePrice(assetId));
      if (!price) {
        throw new Error(`Oracle price not found for asset ${assetId}`);
      }
      return price;
    },
    [oraclePrices.selectors.selectOraclePricesState]
  ),

  getOraclePrices: storeService.withRequiredData(
    (assetIds: AssetId[]) => {
      const allPrices = storeService.select(oraclePrices.selectors.selectAllOraclePrices);
      const pricesMap = new Map<AssetId, OraclePrice>();

      assetIds.forEach((assetId) => {
        const price = allPrices[assetId];
        if (price) {
          pricesMap.set(assetId, price);
        }
      });

      return pricesMap;
    },
    [oraclePrices.selectors.selectOraclePricesState]
  ),

  getMarketConfig: storeService.withRequiredData(
    (assetId: AssetId) => {
      const config = storeService.select(marketConfigs.selectors.selectMarketConfig(assetId));
      if (!config) {
        throw new Error(`Market config not found for asset ${assetId}`);
      }
      return config;
    },
    [marketConfigs.selectors.selectMarketConfigsState]
  ),
});

export type MarketDataService = ReturnType<typeof createMarketDataService>;
