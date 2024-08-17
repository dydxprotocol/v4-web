import { type RootState } from './_store';

export const getCosmosAccount = (state: RootState) => state.cosmosAccount.account;
