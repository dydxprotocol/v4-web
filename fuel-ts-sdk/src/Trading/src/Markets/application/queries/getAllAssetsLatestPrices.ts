import type { StoreService } from '@sdk/shared/lib/StoreService';
import { monomemo } from '@sdk/shared/lib/memo';
import type { AssetPriceEntity } from '../../domain';
import { selectAllAssetPrices, selectAllAssets } from '../../infrastructure';

export const createGetAllAssetsLatestPricesQuery = (storeService: StoreService) => {
  const allAssetsGetter = () => storeService.select(selectAllAssets);
  const assetsPricesGetter = () => storeService.select(selectAllAssetPrices);

  const getAllAssetsPrices = monomemo(
    (
      allAssets: ReturnType<typeof allAssetsGetter>,
      assetsPrices: ReturnType<typeof assetsPricesGetter>
    ) => {
      return allAssets.flatMap((asset) => {
        const assetPrices = assetsPrices.filter((ap) => ap.assetId === asset.assetId);
        return assetPrices.at(0) ?? [];
      });
    }
  );

  return (): AssetPriceEntity[] => {
    return getAllAssetsPrices(allAssetsGetter(), assetsPricesGetter());
  };
};
