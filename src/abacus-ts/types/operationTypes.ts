import {
  IndexerAssetPositionResponseObject,
  IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';

interface AddPerpetualPosition {
  operation: 'ADD_PERPETUAL';
  subaccountNumber: string;
  market: string;
  position: Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>;
}

interface ModifyPerpetualPosition {
  operation: 'MODIFY_PERPETUAL';
  subaccountNumber: string;
  market: string;
  changes: Partial<Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>>;
}

interface ModifyUsdcAssetPosition {
  operation: 'MODIFY_USDC_ASSET';
  subaccountNumber: string;
  changes: Partial<Pick<IndexerAssetPositionResponseObject, 'size' | 'side'>>;
}

export type SubaccountOperation =
  | AddPerpetualPosition
  | ModifyPerpetualPosition
  | ModifyUsdcAssetPosition;

export interface SubaccountBatchedOperations {
  operations: SubaccountOperation[];
}
