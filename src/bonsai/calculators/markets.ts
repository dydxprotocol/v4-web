import BigNumber from 'bignumber.js';
import { mapValues, orderBy, pickBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { SEVEN_DAY_SPARKLINE_ENTRIES } from '@/constants/markets';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
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
import { MaybeBigNumber, MustBigNumber, MustNumber } from '@/lib/numbers';

import { MarketsData } from '../types/rawTypes';
import {
  AllAssetData,
  MarketInfo,
  MarketsInfo,
  PerpetualMarketSparklines,
  PerpetualMarketSummaries,
} from '../types/summaryTypes';
import { formatAssetDataForPerpetualMarketSummary } from './assets';
import { calculatePriceChangePercent } from '../lib/marketUtils';

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

      return {
        ...market,
        ...formattedAssetData,
        sparkline24h: sparklines?.[IndexerSparklineTimePeriod.ONEDAY]?.[market.ticker] ?? EMPTY_ARR,
        isNew,
        isFavorite: listOfFavorites.includes(market.ticker),
        isUnlaunched: false,
      };
    }),
    isTruthy
  );
}
