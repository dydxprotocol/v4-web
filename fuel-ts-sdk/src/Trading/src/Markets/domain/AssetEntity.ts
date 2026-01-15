import type { AssetId, ContractId } from '@sdk/shared/types';

export interface AssetEntity {
  name: string;
  symbol: string;
  decimals: number;
  assetId: AssetId;
  contractId?: ContractId;
  isBaseAsset?: true;
}
