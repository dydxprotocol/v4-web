import BigNumber from 'bignumber.js';
import { mapValues } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import {
  IndexerSparklineResponseObject,
  IndexerWsBaseMarketObject,
} from '@/types/indexer/indexerManual';

import {
  getAssetFromMarketId,
  getDisplayableAssetFromTicker,
  getDisplayableTickerFromMarket,
} from '@/lib/assetUtils';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { MarketsData } from '../types/rawTypes';
import { MarketInfo, MarketsInfo } from '../types/summaryTypes';

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
    effectiveInitialMarginFraction: getMarketEffectiveInitialMarginForMarket(market),
    openInterestUSDC: MustBigNumber(market.openInterest)
      .times(market.oraclePrice ?? 0)
      .toNumber(),
    percentChange24h: MustBigNumber(market.oraclePrice).isZero()
      ? null
      : MustBigNumber(market.priceChange24H)
          .div(market.oraclePrice ?? 0)
          .toNumber(),
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
      return sparkline.map((point) => MustBigNumber(point).toNumber());
    });
  });
}
