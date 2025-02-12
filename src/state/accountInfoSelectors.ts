import { type RootState } from './_store';

/**
 * @param state
 * @returns identifier of the current subaccount
 */
export const getSubaccountId = (state: RootState) => state.wallet.localWallet?.subaccountNumber;

export const getUserWalletAddress = (state: RootState) => state.wallet.localWallet?.address;

export const getUserSourceWalletAddress = (state: RootState) => state.wallet.sourceAccount.address;
