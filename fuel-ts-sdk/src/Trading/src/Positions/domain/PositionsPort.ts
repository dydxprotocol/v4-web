import type { Address, AssetId } from '@sdk/shared/types';
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
  getPositionsByAccount(account: Address, latestOnly?: boolean): Promise<PositionEntity[]>;
}
