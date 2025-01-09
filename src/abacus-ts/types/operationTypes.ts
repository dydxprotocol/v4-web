import { ofType, unionize, UnionOf } from 'unionize';

import {
  IndexerAssetPositionResponseObject,
  IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';

export const SubaccountOperations = unionize(
  {
    AddPerpetualPosition: ofType<{
      subaccountNumber: string;
      market: string;
      position: Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>;
    }>(),
    ModifyPerpetualPosition: ofType<{
      subaccountNumber: string;
      market: string;
      changes: Partial<Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>>;
    }>(),
    ModifyUsdcAssetPosition: ofType<{
      subaccountNumber: string;
      changes: Partial<Pick<IndexerAssetPositionResponseObject, 'size' | 'side'>>;
    }>(),
  },
  { tag: 'operation' as const, value: 'payload' as const }
);

export type SubaccountOperation = UnionOf<typeof SubaccountOperations>;

export interface SubaccountBatchedOperations {
  operations: SubaccountOperation[];
}
