import { WalletType } from '@/constants/wallets';

import type { RootState } from './_store';
import { createAppSelector } from './appTypes';

/**
 * @returns saved wallet and account information
 */
export const getSourceAccount = (state: RootState) => state.wallet.sourceAccount;

export const selectIsKeplrConnected = createAppSelector(
  [getSourceAccount],
  (sourceAccount) => sourceAccount.walletInfo?.name === WalletType.Keplr
);

export const getLocalWalletNonce = (state: RootState) => state.wallet.localWalletNonce;
