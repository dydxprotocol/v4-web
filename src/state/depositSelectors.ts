import { type RootState } from './_store';

export const getDepositType = (state: RootState) => state.deposit.depositType;
