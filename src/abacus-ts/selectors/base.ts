import { type RootState } from '@/state/_store';

export const selectRawState = (state: RootState) => state.raw;

export const selectRawAccountState = (state: RootState) => state.raw.account;

export const selectRawMarketsState = (state: RootState) => state.raw.markets.allMarkets;

export const selectParentSubaccountData = (state: RootState) =>
  state.raw.account.parentSubaccount.data;
export const selectFillsData = (state: RootState) => state.raw.account.fills.data;
export const selectOrdersData = (state: RootState) => state.raw.account.orders.data;
export const selectTransfersData = (state: RootState) => state.raw.account.transfers.data;
export const selectBlockTradingRewardsData = (state: RootState) =>
  state.raw.account.blockTradingRewards.data;
