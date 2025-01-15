import { ofType, unionize, UnionOf } from 'unionize';

import {
  IndexerAssetPositionResponseObject,
  IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';

export type AddPerpetualPositionProps = {
  subaccountNumber: number;
  market: string;
  changes: Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>;
};

export type ModifyPerpetualPositionProps = {
  changes: Partial<Omit<IndexerPerpetualPositionResponseObject, 'market' | 'subaccountNumber'>>;
};

export type ModifyUsdcAssetPositionProps = {
  subaccountNumber: number;
  changes: IndexerAssetPositionResponseObject;
};

export const SubaccountOperations = unionize(
  {
    AddPerpetualPosition: ofType<AddPerpetualPositionProps>(),
    ModifyPerpetualPosition: ofType<ModifyPerpetualPositionProps>(),
    ModifyUsdcAssetPosition: ofType<ModifyUsdcAssetPositionProps>(),
  },
  { tag: 'operation' as const, value: 'payload' as const }
);

export type SubaccountOperation = UnionOf<typeof SubaccountOperations>;

export interface SubaccountBatchedOperations {
  operations: SubaccountOperation[];
}
