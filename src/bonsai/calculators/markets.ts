import BigNumber from 'bignumber.js';
import { mapValues, orderBy, pickBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { SEVEN_DAY_SPARKLINE_ENTRIES } from '@/constants/markets';
import { QUANTUM_MULTIPLIER, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { IndexerSparklineTimePeriod } from '@/types/indexer/indexerApiGen';
import {
  IndexerSparklineResponseObject,
  IndexerWsBaseMarketObject,
} from '@/types/indexer/indexerManual';

import {
  getAssetFromMarketId,
  getDisplayableAssetFromTicker,
  getDisplayableTickerFromMarket,
} from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { BIG_NUMBERS, MaybeBigNumber, MustBigNumber, MustNumber } from '@/lib/numbers';
import { objectFromEntries } from '@/lib/objectHelpers';

import { MarketsData } from '../types/rawTypes';
import {
  AllAssetData,
  AllPerpetualMarketsFeeDiscounts,
  MarketInfo,
  MarketsInfo,
  PerpetualMarketFeeDiscount,
  PerpetualMarketSparklines,
  PerpetualMarketSummaries,
} from '../types/summaryTypes';
import { formatAssetDataForPerpetualMarketSummary } from './assets';

export function calculateAllMarkets(markets: MarketsData | undefined): MarketsInfo | undefined {
  if (markets == null) {
    return markets;
  }

  return mapValues(markets, calculateMarket);
}

export function getMarketEffectiveInitialMarginForMarket(market: IndexerWsBaseMarketObject) {
  const initialMarginFraction = MaybeBigNumber(market.initialMarginFraction);
  const openInterest = MaybeBigNumber(market.openInterest);
  const openInterestLowerCap = MaybeBigNumber(market.openInterestLowerCap);
  const openInterestUpperCap = MaybeBigNumber(market.openInterestUpperCap);
  const oraclePrice = MaybeBigNumber(market.oraclePrice);

  if (initialMarginFraction == null) return null;
  if (
    oraclePrice == null ||
    openInterest == null ||
    openInterestLowerCap == null ||
    openInterestUpperCap == null
  ) {
    return initialMarginFraction;
  }

  // if these are equal we can throw an error from dividing by zero
  if (openInterestUpperCap.eq(openInterestLowerCap)) {
    return initialMarginFraction;
  }

  const openNotional = openInterest.times(oraclePrice);
  const scalingFactor = openNotional
    .minus(openInterestLowerCap)
    .div(openInterestUpperCap.minus(openInterestLowerCap));
  const imfIncrease = scalingFactor.times(MustBigNumber(1).minus(initialMarginFraction));

  const effectiveIMF = BigNumber.minimum(
    initialMarginFraction.plus(BigNumber.maximum(imfIncrease, 0.0)),
    1.0
  );
  return effectiveIMF;
}

function calculateDerivedMarketDisplayItems(market: IndexerWsBaseMarketObject) {
  return {
    assetId: getAssetFromMarketId(market.ticker),
    displayableAsset: getDisplayableAssetFromTicker(market.ticker),
    displayableTicker: getDisplayableTickerFromMarket(market.ticker),
  };
}

function calculatePriceChangePercent(
  priceChange24H: string | null | undefined,
  oraclePrice: string | null | undefined
): BigNumber | null {
  if (priceChange24H == null || oraclePrice == null) {
    return null;
  }

  const price24hAgo = MustBigNumber(oraclePrice).minus(priceChange24H);
  return price24hAgo.gt(0) ? MustBigNumber(priceChange24H).div(price24hAgo) : null;
}

function calculateDerivedMarketCore(market: IndexerWsBaseMarketObject) {
  return {
    effectiveInitialMarginFraction:
      getMarketEffectiveInitialMarginForMarket(market)?.toNumber() ?? null,
    openInterestUSDC: MustBigNumber(market.openInterest)
      .times(market.oraclePrice ?? 0)
      .toNumber(),
    percentChange24h:
      calculatePriceChangePercent(market.priceChange24H, market.oraclePrice)?.toNumber() ?? null,
    stepSizeDecimals: MaybeBigNumber(market.stepSize)?.decimalPlaces() ?? TOKEN_DECIMALS,
    tickSizeDecimals: MaybeBigNumber(market.tickSize)?.decimalPlaces() ?? USD_DECIMALS,
  };
}

const calculateMarket = weakMapMemoize(
  (market: IndexerWsBaseMarketObject): MarketInfo => ({
    ...market,
    ...calculateDerivedMarketDisplayItems(market),
    ...calculateDerivedMarketCore(market),
  })
);

export function formatSparklineData(sparklines?: {
  [period: string]: IndexerSparklineResponseObject | undefined;
}) {
  if (sparklines == null) return sparklines;
  return mapValues(sparklines, (map) => {
    return mapValues(map, (sparkline) => {
      return sparkline.map((point) => MustBigNumber(point).toNumber()).reverse();
    });
  });
}

export function createMarketSummary(
  markets: MarketsInfo | undefined,
  sparklines: PerpetualMarketSparklines | undefined,
  assetInfo: AllAssetData | undefined,
  marketFeeDiscounts: AllPerpetualMarketsFeeDiscounts | undefined,
  listOfFavorites: string[]
): PerpetualMarketSummaries | undefined {
  if (markets == null) {
    return undefined;
  }

  const recentMarketIdsByClobPairId = new Set(
    orderBy(Object.values(markets), [(m) => MustNumber(m.clobPairId)], ['desc'])
      .slice(0, 5)
      .map((m) => m.ticker)
  );

  return pickBy(
    mapValues(markets, (market) => {
      const isNew =
        recentMarketIdsByClobPairId.has(market.ticker) ||
        Boolean(
          (sparklines?.[IndexerSparklineTimePeriod.SEVENDAYS]?.[market.ticker]?.length ?? 0) <
            SEVEN_DAY_SPARKLINE_ENTRIES
        );

      const assetData = assetInfo?.[market.assetId];

      const formattedAssetData = formatAssetDataForPerpetualMarketSummary(assetData, market);

      const feeData = marketFeeDiscounts?.[market.clobPairId];
      const marketFeeDiscountMultiplier =
        feeData && feeData.isApplicable ? feeData.feeDiscountMultiplier : undefined;

      return {
        ...market,
        ...formattedAssetData,
        sparkline24h: sparklines?.[IndexerSparklineTimePeriod.ONEDAY]?.[market.ticker] ?? EMPTY_ARR,
        isNew,
        isFavorite: listOfFavorites.includes(market.ticker),
        isUnlaunched: false,
        marketFeeDiscountMultiplier,
      };
    }),
    isTruthy
  );
}

/**
 * Calculate the effective selected leverage for a market.
 * Returns user-selected leverage if set, otherwise calculates max leverage from IMF only (ignoring OIMF).
 */
export function calculateEffectiveSelectedLeverage({
  userSelectedLeverage,
  initialMarginFraction,
}: {
  userSelectedLeverage: number | undefined;
  initialMarginFraction: string | number | BigNumber | null | undefined;
}): number {
  return calculateEffectiveSelectedLeverageBigNumber({
    userSelectedLeverage,
    initialMarginFraction,
  }).toNumber();
}

/**
 * Calculate the effective selected leverage for a market, returning BigNumber.
 * Returns user-selected leverage if set, otherwise calculates max leverage from IMF only (ignoring OIMF).
 */
export function calculateEffectiveSelectedLeverageBigNumber({
  userSelectedLeverage,
  initialMarginFraction,
}: {
  userSelectedLeverage: number | undefined;
  initialMarginFraction: string | number | BigNumber | null | undefined;
}): BigNumber {
  // Return user-selected leverage if it exists
  if (userSelectedLeverage != null) {
    return MaybeBigNumber(userSelectedLeverage) ?? BIG_NUMBERS.ONE;
  }

  // Otherwise calculate from IMF only (ignoring OIMF as requested)
  const imf = MaybeBigNumber(initialMarginFraction);
  if (imf != null && !imf.isZero()) {
    return BIG_NUMBERS.ONE.div(imf);
  }

  // Fallback
  return BIG_NUMBERS.ONE;
}

export function calculateMarketsFeeDiscounts(
  feeDiscounts: PerpetualMarketFeeDiscount | undefined
): AllPerpetualMarketsFeeDiscounts | undefined {
  if (feeDiscounts == null) return undefined;

  const now = Date.now();

  const discountEntries = objectFromEntries(
    feeDiscounts.map((discount) => {
      const startTimeMs =
        discount.startTime != null ? new Date(discount.startTime).getTime() : null;
      const endTimeMs = discount.endTime != null ? new Date(discount.endTime).getTime() : null;

      return [
        discount.clobPairId,
        {
          ...discount,
          isApplicable:
            startTimeMs != null && endTimeMs != null && now >= startTimeMs && now < endTimeMs,
          feeDiscountMultiplier: MustBigNumber(discount.chargePpm)
            .div(QUANTUM_MULTIPLIER)
            .toNumber(),
        },
      ];
    })
  );

  return discountEntries;
}
