import { ofType, unionize, UnionOf } from 'unionize';

import {
  IndexerAssetPositionResponseObject,
  IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';

export const SubaccountOperations = unionize(
  {
    AddPerpetualPosition: ofType<{
      subaccountNumber: number;
      market: string;
      position: Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>;
    }>(),
    ModifyPerpetualPosition: ofType<{
      subaccountNumber: number;
      market: string;
      changes: Partial<Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>>;
    }>(),
    ModifyUsdcAssetPosition: ofType<{
      subaccountNumber: number;
      changes: Partial<Pick<IndexerAssetPositionResponseObject, 'size'>>;
    }>(),
  },
  { tag: 'operation' as const, value: 'payload' as const }
);

export type SubaccountOperation = UnionOf<typeof SubaccountOperations>;

export interface SubaccountBatchedOperations {
  operations: SubaccountOperation[];
}
