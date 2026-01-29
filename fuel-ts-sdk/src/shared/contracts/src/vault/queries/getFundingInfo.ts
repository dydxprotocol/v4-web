import type { AssetId } from '@sdk/shared/types';
import type { VaultContractPort } from '../../VaultContractPort';

export interface FundingInfo {
  assetId: AssetId;
  totalShortSizes: string;
  totalLongSizes: string;
  longCumulativeFundingRate: string;
  shortCumulativeFundingRate: string;
  lastFundingTime: number;
}

export interface GetFundingInfoDependencies {
  vaultContractPort: VaultContractPort;
}

export const createGetFundingInfoQuery =
  (deps: GetFundingInfoDependencies) =>
  async (indexAsset: AssetId): Promise<FundingInfo> => {
    const vault = await deps.vaultContractPort.getVaultContract();
    const { value } = await vault.functions.get_funding_info(indexAsset).get();

    return {
      assetId: indexAsset,
      totalShortSizes: value.total_short_sizes.toString(),
      totalLongSizes: value.total_long_sizes.toString(),
      longCumulativeFundingRate: value.long_cumulative_funding_rate.toString(),
      shortCumulativeFundingRate: value.short_cumulative_funding_rate.toString(),
      lastFundingTime: Number(value.last_funding_time),
    };
  };
