import type { RootState } from './_store';

/**
 * @returns saved wallet and account information
 */
export const getSourceAccount = (state: RootState) => state.wallet.sourceAccount;

/**
 * @returns whether the wallet has an offline signer
 */
export const getHasOfflineSigner = (state: RootState) => state.wallet.hasOfflineSigner;
