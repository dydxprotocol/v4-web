import { AssetData, PerpetualMarketSummary } from '@/bonsai/types/summaryTypes';

import { ISOLATED_LIQUIDITY_TIER_INFO, MarketData } from '@/constants/markets';

import {
  getDisplayableAssetFromTicker,
  getDisplayableTickerFromMarket,
  getMarketIdFromAsset,
} from './assetUtils';
import { BIG_NUMBERS, MustBigNumber } from './numbers';
import { safeAssign } from './objectHelpers';

export function calculateMarketMaxLeverage({
  effectiveInitialMarginFraction,
  initialMarginFraction,
}: Pick<MarketData, 'effectiveInitialMarginFraction' | 'initialMarginFraction'>) {
  if (effectiveInitialMarginFraction) {
    return BIG_NUMBERS.ONE.div(effectiveInitialMarginFraction).toNumber();
  }

  if (initialMarginFraction) {
    return BIG_NUMBERS.ONE.div(initialMarginFraction).toNumber();
  }

  return 10; // default
}

export function getMarketDataFromPerpetualMarketSummary(
  market: PerpetualMarketSummary
): MarketData {
  const {
    ticker: id,
    assetId,
    displayableTicker: displayId,
    displayableAsset,
    clobPairId,
    effectiveInitialMarginFraction,
    logo,
    initialMarginFraction,
    isNew,
    sparkline24h,
    name,
    nextFundingRate,
    openInterest,
    openInterestUSDC,
    oraclePrice,
    priceChange24H,
    percentChange24h,
    tickSizeDecimals,
    trades24H: trades24h,
    volume24H,
    spotVolume24h,
    marketCap,
    sectorTags,
    isFavorite,
  } = market;

  return {
    id,
    assetId,
    displayId,
    displayableAsset,
    clobPairId,
    effectiveInitialMarginFraction,
    logo,
    initialMarginFraction: MustBigNumber(initialMarginFraction).toNumber(),
    isNew,
    isUnlaunched: false,
    sparkline24h,
    name,
    nextFundingRate: MustBigNumber(nextFundingRate).toNumber(),
    openInterest: MustBigNumber(openInterest).toNumber(),
    openInterestUSDC,
    oraclePrice: MustBigNumber(oraclePrice).toNumber(),
    priceChange24h: MustBigNumber(priceChange24H).toNumber(),
    percentChange24h,
    tickSizeDecimals,
    trades24h,
    volume24h: MustBigNumber(volume24H).toNumber(),
    spotVolume24h,
    marketCap,
    sectorTags,
    isFavorite,
  };
}

export function getMarketDataFromAsset(asset: AssetData, favoritedMarkets: string[]): MarketData {
  const {
    assetId,
    name,
    logo,
    price,
    percentChange24h,
    sectorTags,
    marketCap,
    reportedMarketCap,
    tickSizeDecimals,
    volume24h: spotVolume24h,
  } = asset;

  const ticker = getMarketIdFromAsset(assetId);
  const displayId = getDisplayableTickerFromMarket(ticker);
  const displayableAsset = getDisplayableAssetFromTicker(ticker);

  return safeAssign({}, {
    id: ticker,
    assetId,
    displayId,
    displayableAsset,
    clobPairId: '-1',
    effectiveInitialMarginFraction: ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction,
    logo,
    initialMarginFraction: ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction,
    isNew: false,
    isUnlaunched: true,
    sparkline24h: null,
    name,
    nextFundingRate: undefined,
    openInterest: undefined,
    openInterestUSDC: undefined,
    oraclePrice: price,
    priceChange24h:
      price && percentChange24h
        ? MustBigNumber(price).times(MustBigNumber(percentChange24h).div(100)).toNumber()
        : undefined,
    percentChange24h: MustBigNumber(percentChange24h).div(100).toNumber(),
    tickSizeDecimals,
    trades24h: undefined,
    volume24h: undefined,
    spotVolume24h,
    marketCap: marketCap ?? reportedMarketCap,
    sectorTags: sectorTags ?? [],
    isFavorite: favoritedMarkets.includes(ticker),
  } satisfies MarketData);
}
