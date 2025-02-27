import type { RootState } from './_store';

/**
 * @returns saved wallet and account information
 */
export const getSourceAccount = (state: RootState) => state.wallet.sourceAccount;

export const getLocalWalletNonce = (state: RootState) => state.wallet.localWalletNonce;
