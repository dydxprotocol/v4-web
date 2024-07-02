import { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { getCurrentMarketId } from './perpetualsSelectors';

export const getVaultsMetadata = (s: RootState) => s.vaults.vaults;
export const getVaultsDetails = (s: RootState) => s.vaults.vaultDetails;

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
