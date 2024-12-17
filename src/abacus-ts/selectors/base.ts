import { type RootState } from '@/state/_store';

export const selectRawState = (state: RootState) => state.raw;

export const selectRawAccountState = (state: RootState) => state.raw.account;

export const selectRawMarketsState = (state: RootState) => state.raw.markets.allMarkets;
export const selectRawMarketsData = (state: RootState) => state.raw.markets.allMarkets.data;

export const selectRawParentSubaccount = (state: RootState) => state.raw.account.parentSubaccount;
export const selectRawParentSubaccountData = (state: RootState) =>
  state.raw.account.parentSubaccount.data;

export const selectRawFillsData = (state: RootState) => state.raw.account.fills.data;
export const selectRawOrdersData = (state: RootState) => state.raw.account.orders.data;
export const selectRawTransfersData = (state: RootState) => state.raw.account.transfers.data;
export const selectRawBlockTradingRewardsData = (state: RootState) =>
  state.raw.account.blockTradingRewards.data;
