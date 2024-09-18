import { RootState } from './_store';
import { createAppSelector } from './appTypes';

export const getVaultDetails = (s: RootState) => s.vaults.vaultDetails;
export const getVaultAccount = (s: RootState) => s.vaults.vaultAccount;
export const getVaultForm = (s: RootState) => s.vaults.vaultForm;

export const getVaultPositions = createAppSelector(
  [(s: RootState) => s.vaults.vaultPositions?.positions],
  (points) => points?.toArray()
);

export const getVaultAccountTransfers = createAppSelector(
  [(s: RootState) => s.vaults.vaultAccount?.vaultTransfers],
  (points) => points?.toArray()
);

export const getVaultPnlHistory = createAppSelector(
  [(s: RootState) => s.vaults.vaultDetails?.history],
  (points) => points?.toArray()
);
