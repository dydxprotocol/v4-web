import { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { getAssets } from './assetsSelectors';
import { getCurrentMarketId, getPerpetualMarkets } from './perpetualsSelectors';

export const getVaultsMetadata = (s: RootState) => s.vaults.vaults;
export const getVaultsDetails = (s: RootState) => s.vaults.vaultDetails;
export const getUserVaults = (s: RootState) => s.vaults.userVaults;

export const getCurrentMarketVaultMetadata = createAppSelector(
  [getCurrentMarketId, getVaultsMetadata],
  (currentMarketId, vaults) => (currentMarketId != null ? vaults[currentMarketId] : undefined)
);

export const getCurrentMarketVaultDetails = createAppSelector(
  [getCurrentMarketId, getVaultsDetails],
  (currentMarketId, vaults) => (currentMarketId != null ? vaults[currentMarketId] : undefined)
);

export const getCurrentMarketHasVault = createAppSelector(
  [getCurrentMarketVaultMetadata],
  (m) => m != null
);

export const getVaultsTableData = createAppSelector(
  [getVaultsMetadata, getUserVaults, getAssets, getPerpetualMarkets],
  (allVaults, userVaults, assets, markets) =>
    Object.keys(allVaults).map((marketId) => ({
      asset: assets?.[markets?.[marketId]?.assetId ?? ''],
      marketId,
      vault: allVaults[marketId],
      userInfo: userVaults[marketId],
    }))
);
