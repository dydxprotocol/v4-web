import type { Address, AssetId, PositionStableId } from '@/shared/types';
import type { Position } from './positions.entity';

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
  getPositionsByStableId(stableId: PositionStableId, latestOnly?: boolean): Promise<Position[]>;
  getPositionsByAccount(account: Address, latestOnly?: boolean): Promise<Position[]>;
}
