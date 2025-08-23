import { MustBigNumber } from "@/lib/numbers";
import BigNumber from "bignumber.js";

// Shared transformer so REST and WS produce the same shape
function countDecimalsFromString(s?: string) {
  if (!s) return 0;
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

type RawMarkets = Record<string, any>;
type SummaryMarkets = Record<string, any>; // define a proper interface if available

export function transformMarkets(markets: RawMarkets): SummaryMarkets {
  const out: SummaryMarkets = {};
  for (const [marketId, market] of Object.entries(markets)) {
    const asset = market.ticker.split('-')[0];
    const oraclePrice = parseFloat(market.oraclePrice ?? '0');
    out[marketId] = {
      ...market,
      assetId: asset,
      displayableAsset: asset,
      displayableTicker: market.ticker,
      effectiveInitialMarginFraction: parseFloat(market.initialMarginFraction) ?? null,
      openInterestUSDC: (parseFloat(market.openInterest) ?? 0) * oraclePrice,
      // NOTE: pick one naming convention; see next comment about percent vs price
      priceChange24h: parseFloat(market.priceChange24H) ?? 0,
      percentChange24h: calculatePriceChangePercent(market.priceChange24H, market.oraclePrice.toString() || '0') || 0,
      stepSizeDecimals: countDecimalsFromString(market.stepSize),
      tickSizeDecimals: countDecimalsFromString(market.tickSize),

      name: asset,
      logo: null,
      sectorTags: [],
      sparkline24h: [],
      isNew: false,
      spotVolume24h: null,
      isFavorite: false,
      isUnlaunched: false,

      oraclePrice,
      volume24h: parseFloat(market.volume24H) || 0,
      trades24h: market.trades24H,
      nextFundingRate: parseFloat(market.nextFundingRate) || 0,
      openInterest: parseFloat(market.openInterest) || 0,
      marketCap: null,
      status: market.status,
    };
  }
  return out;
}

export function calculatePriceChangePercent(
  priceChange24H: string | null | undefined,
  oraclePrice: string | null | undefined): BigNumber | null {
  if (priceChange24H == null || oraclePrice == null) {
    return null;
  }

  const price24hAgo = MustBigNumber(oraclePrice).minus(priceChange24H);
  return price24hAgo.gt(0) ? MustBigNumber(priceChange24H).div(price24hAgo) : null;
}
