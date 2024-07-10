import { RootState } from './_store';

export const getVaultDetails = (s: RootState) => s.vaults.vaultDetails;
export const getUserVault = (s: RootState) => s.vaults.userVault;
export const getVaultPnlHistory = (s: RootState) => s.vaults.vaultHistory.pnlAndEquityDataPoints;
