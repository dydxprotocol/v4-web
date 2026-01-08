import type { AssetId, ContractId } from '@/shared/types';

export interface Asset {
  name: string;
  symbol: string;
  decimals: number;
  assetId: AssetId;
  contractId?: ContractId;
}
