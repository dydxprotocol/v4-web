import { RootState } from './_store';

export const getVaultDetails = (s: RootState) => s.vaults.vaultDetails;
export const getUserVault = (s: RootState) => s.vaults.userVaults;
