import type { GraphQLClient } from 'graphql-request';
import type { AssetPriceRepository } from '../../../domain';
import { getAssetPricesByIds } from './getAssetPricesByIds';
import { getCurrentAssetPrice } from './getCurrentAssetPrice';
import { getHistoricalAssetPrices } from './getHistoricalAssetPrices';

export const createGraphQLAssetPriceRepository = (client: GraphQLClient): AssetPriceRepository => ({
  getAssetPricesByIds: getAssetPricesByIds(client),
  getCurrentAssetPrice: getCurrentAssetPrice(client),
  getHistoricalAssetPrices: getHistoricalAssetPrices(client),
});
