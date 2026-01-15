import type { Address, AssetId, PositionStableId } from '@sdk/shared/types';
import type { PositionEntity } from './PositionsEntity';

/**
 * Query options for fetching positions
 */
export interface GetPositionsOptions {
  limit?: number;
  offset?: number;
  account?: Address;
  indexAssetId?: AssetId;
  isLong?: boolean;
  latestOnly?: boolean;
  orderBy?: 'TIMESTAMP_ASC' | 'TIMESTAMP_DESC';
}

/**
 * PositionRepository - Port (interface) defining position data access contract
 */
export interface PositionRepository {
  getPositionsByStableId(
    stableId: PositionStableId,
    latestOnly?: boolean
  ): Promise<PositionEntity[]>;
  getPositionsByAccount(account: Address, latestOnly?: boolean): Promise<PositionEntity[]>;
}
