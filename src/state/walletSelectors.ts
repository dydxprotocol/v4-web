import { RootState } from './_store';

/**
 * @returns saved wallet and account information
 */
export const getSourceAccount = (state: RootState) => state.wallet.sourceAccount;
