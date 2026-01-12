import type { GraphQLClient } from 'graphql-request';
import type { AssetPriceRepository } from '../../../domain';
import { getAssetPricesByIds } from './get-asset-prices-by-ids';
import { getCurrentAssetPrice } from './get-current-asset-price';
import { getHistoricalAssetPrices } from './get-historical-asset-prices';

export const createGraphQLAssetPriceRepository = (client: GraphQLClient): AssetPriceRepository => ({
  getAssetPricesByIds: getAssetPricesByIds(client),
  getCurrentAssetPrice: getCurrentAssetPrice(client),
  getHistoricalAssetPrices: getHistoricalAssetPrices(client),
});
