import { type RootState } from '@/state/_store';

export const selectRawState = (state: RootState) => state.raw;

export const selectRawAccountState = (state: RootState) => state.raw.account;

export const selectRawMarketsState = (state: RootState) => state.raw.markets.allMarkets;
export const selectRawMarketsData = (state: RootState) => state.raw.markets.allMarkets.data;

export const selectRawParentSubaccount = (state: RootState) => state.raw.account.parentSubaccount;
export const selectRawParentSubaccountData = (state: RootState) =>
  state.raw.account.parentSubaccount.data;

export const selectRawFillsRestData = (state: RootState) => state.raw.account.fills.data;
export const selectRawOrdersRestData = (state: RootState) => state.raw.account.orders.data;
export const selectRawTransfersRestData = (state: RootState) => state.raw.account.transfers.data;
export const selectRawBlockTradingRewardsRestData = (state: RootState) =>
  state.raw.account.blockTradingRewards.data;

export const selectRawFillsLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.ephemeral.fills;
export const selectRawOrdersLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.ephemeral.orders;
export const selectRawTransfersLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.ephemeral.transfers;
export const selectRawBlockTradingRewardsLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.ephemeral.tradingRewards;

export const selectRawIndexerHeight = (state: RootState) => state.raw.heights.indexerHeight.data;
export const selectRawValidatorHeight = (state: RootState) =>
  state.raw.heights.validatorHeight.data;
