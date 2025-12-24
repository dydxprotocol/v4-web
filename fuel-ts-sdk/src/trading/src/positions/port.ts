import type { Address, AssetId } from '@/shared/types';
import type { Position } from './domain';

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
  getPositions(options?: GetPositionsOptions): Promise<Position[]>;
  getPositionsByAccount(account: Address, latestOnly?: boolean): Promise<Position[]>;
  getPositionsByAsset(indexAssetId: AssetId, isLong?: boolean, latestOnly?: boolean): Promise<Position[]>;
  getCurrentPositions(account: Address): Promise<Position[]>;
}
