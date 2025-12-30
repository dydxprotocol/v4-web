import type { GraphQLClient } from 'graphql-request';
import type { AssetId } from '@/shared/types';
import type { Position } from '../../../domain';
import { getPositions } from './get-positions';

export const getPositionsByAsset =
  (client: GraphQLClient) =>
  async (indexAssetId: AssetId, isLong?: boolean, latestOnly = true): Promise<Position[]> => {
    return getPositions(client)({ indexAssetId, isLong, latestOnly });
  };
