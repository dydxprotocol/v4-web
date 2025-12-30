import type { GraphQLClient } from 'graphql-request';
import type { AssetPriceRepository } from '../../../domain';
import { getAssetPricesByIds } from './get-asset-prices-by-ids';
import { getCurrentAssetPrices } from './get-current-asset-prices';
import { getHistoricalAssetPrices } from './get-historical-asset-prices';

export const createGraphQLAssetPriceRepository = (client: GraphQLClient): AssetPriceRepository => ({
  getAssetPricesByIds: getAssetPricesByIds(client),
  getCurrentAssetPrices: getCurrentAssetPrices(client),
  getHistoricalAssetPrices: getHistoricalAssetPrices(client),
});
