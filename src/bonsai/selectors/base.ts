import { type RootState } from '@/state/_store';

export const selectRawState = (state: RootState) => state.raw;

export const selectRawAccountState = (state: RootState) => state.raw.account;

export const selectRawMarkets = (state: RootState) => state.raw.markets.allMarkets;
export const selectRawMarketsData = (state: RootState) => state.raw.markets.allMarkets.data;
export const selectRawMarketsFeeDiscounts = (state: RootState) =>
  state.raw.markets.feeDiscounts.data;
export const selectRawAssetsData = (state: RootState) => state.raw.markets.assets.data;
export const selectRawAssets = (state: RootState) => state.raw.markets.assets;
export const selectRawSparklines = (state: RootState) => state.raw.markets.sparklines;
export const selectRawSparklinesData = (state: RootState) => state.raw.markets.sparklines.data;
export const selectRawOrderbooks = (state: RootState) => state.raw.markets.orderbooks;

export const selectRawParentSubaccount = (state: RootState) => state.raw.account.parentSubaccount;
export const selectRawParentSubaccountData = (state: RootState) =>
  state.raw.account.parentSubaccount.data;

export const selectRawFillsRestData = (state: RootState) => state.raw.account.fills.data;
export const selectRawOrdersRestData = (state: RootState) => state.raw.account.orders.data;
export const selectRawTransfersRestData = (state: RootState) => state.raw.account.transfers.data;
export const selectRawBlockTradingRewardsRestData = (state: RootState) =>
  state.raw.account.blockTradingRewards.data;

export const selectRawFillsLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.live.fills;
export const selectRawOrdersLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.live.orders;
export const selectRawTransfersLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.live.transfers;
export const selectRawBlockTradingRewardsLiveData = (state: RootState) =>
  state.raw.account.parentSubaccount.data?.live.tradingRewards;

export const selectRawIndexerHeightData = (state: RootState) => state.raw.heights.indexerHeight;
export const selectRawValidatorHeightData = (state: RootState) => state.raw.heights.validatorHeight;
export const selectRawIndexerHeightDataLoading = (state: RootState) =>
  state.raw.heights.indexerHeight.latest.status;
export const selectRawValidatorHeightDataLoading = (state: RootState) =>
  state.raw.heights.validatorHeight.latest.status;
export const selectRawIndexerHeightDataLoadable = (state: RootState) =>
  state.raw.heights.indexerHeight.latest;
export const selectRawValidatorHeightDataLoadable = (state: RootState) =>
  state.raw.heights.validatorHeight.latest;

export const selectRawFillsRest = (state: RootState) => state.raw.account.fills;
export const selectRawOrdersRest = (state: RootState) => state.raw.account.orders;
export const selectRawTransfersRest = (state: RootState) => state.raw.account.transfers;
export const selectRawBlockTradingRewardsRest = (state: RootState) =>
  state.raw.account.blockTradingRewards;

export const selectRawIndexerHeight = (state: RootState) => state.raw.heights.indexerHeight;
export const selectRawValidatorHeight = (state: RootState) => state.raw.heights.validatorHeight;

export const selectRawConfigFeeTiers = (state: RootState) => state.raw.configs.data?.feeTiers;
export const selectRawConfigEquityTiers = (state: RootState) => state.raw.configs.data?.equityTiers;
export const selectRawConfigStakingTiers = (state: RootState) =>
  state.raw.configs.data?.stakingTiers;

export const selectRawAccountFeeTierData = (state: RootState) => state.raw.account.feeTier.data;
export const selectRawAccountStakingTierData = (state: RootState) =>
  state.raw.account.stakingTier.data;
export const selectRawAccountStatsData = (state: RootState) => state.raw.account.stats.data;

export const selectRawAccountBalancesData = (state: RootState) => state.raw.account.balances.data;
export const selectRawAccountNobleUsdcBalanceData = (state: RootState) =>
  state.raw.account.nobleUsdcBalance.data;

export const selectRawLocalAddressScreenV2 = (state: RootState) =>
  state.raw.compliance.localAddressScreenV2;
export const selectRawSourceAddressScreenV2 = (state: RootState) =>
  state.raw.compliance.sourceAddressScreenV2;
export const selectRawGeo = (state: RootState) => state.raw.compliance.geo;

export const selectRawRewardParams = (state: RootState) => state.raw.rewards.data.data;
export const selectRawRewardPrice = (state: RootState) => state.raw.rewards.price.data;

export const selectRawSelectedMarketLeverages = (state: RootState) =>
  state.raw.markets.selectedMarketLeverages;
export const selectRawSelectedMarketLeveragesData = (state: RootState) =>
  state.raw.markets.selectedMarketLeverages.data;
export const selectRawSpotSolPrice = (state: RootState) => state.raw.spot.solPrice.data;
export const selectRawSpotSolPriceLoading = (state: RootState) => state.raw.spot.solPrice.status;
export const selectRawSpotTokenPrice = (state: RootState) => state.raw.spot.tokenPrice.data;
export const selectRawSpotTokenPriceLoading = (state: RootState) =>
  state.raw.spot.tokenPrice.status;

export const selectRawSpotTokenMetadata = (state: RootState) => state.raw.spot.tokenMetadata.data;
export const selectRawSpotTokenMetadataLoading = (state: RootState) =>
  state.raw.spot.tokenMetadata.status;

export const selectRawSpotWalletPositions = (state: RootState) =>
  state.raw.spot.walletPositions.data;
export const selectRawSpotWalletPositionsLoading = (state: RootState) =>
  state.raw.spot.walletPositions.status;

export const selectRawSpotPortfolioTrades = (state: RootState) =>
  state.raw.spot.portfolioTrades.data;
export const selectRawSpotPortfolioTradesLoading = (state: RootState) =>
  state.raw.spot.portfolioTrades.status;
