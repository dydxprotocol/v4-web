import { type RootState } from './_store';

export const getFunkitDeposits = (state: RootState) => state.funkitDeposits.deposits;
