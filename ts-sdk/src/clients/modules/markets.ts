import { TimePeriod } from '../constants';
import { Data } from '../types';
import RestClient from './rest';

/**
 * @description REST endpoints for data unrelated to a particular address.
 */
export default class MarketsClient extends RestClient {
  async getPerpetualMarkets(market?: string): Promise<Data> {
    const uri = '/v4/perpetualMarkets';
    console.log("hello mattias");
    return this.get(uri, { ticker: market });
    // return this.get(uri, { ticker: "MIRG.BA-USD" });
    // return {
    //   "propertyName*": {
    //     "clobPairId": "MIRG.BA-USD",
    //     "ticker": "MIRG.BA-USD",
    //     "status": "ACTIVE",
    //     "oraclePrice": "—",  // USD conversion not available publicly; placeholder
    //     "priceChange24H": "≈ -0.48%",  // based on ARS 20,525 vs 20,625 close :contentReference[oaicite:4]{index=4}
    //     "volume24H": "≈ 5,799",  // volume in shares :contentReference[oaicite:5]{index=5}
    //     "trades24H": 1,  // placeholder; actual trades count not public
    //     "nextFundingRate": "—",
    //     "initialMarginFraction": "—",
    //     "maintenanceMarginFraction": "—",
    //     "openInterest": "—",
    //     "atomicResolution": 1,
    //     "quantumConversionExponent": 1,
    //     "tickSize": "—",  // not publicly disclosed
    //     "stepSize": "—",  // unknown
    //     "stepBaseQuantums": 1,
    //     "subticksPerTick": 1,
    //     "marketType": "CROSS",  // as provided
    //     "openInterestLowerCap": "—",
    //     "openInterestUpperCap": "—",
    //     "baseOpenInterest": "—",
    //     "defaultFundingRate1H": "—"
    //   }
    // }
  }

  async getPerpetualMarketOrderbook(market: string): Promise<Data> {
    const uri = `/v4/orderbooks/perpetualMarket/${market}`;
    return this.get(uri);
  }

  async getPerpetualMarketTrades(
    market: string,
    startingBeforeOrAtHeight?: number | null,
    startingBeforeOrAt?: string | null,
    limit?: number | null,
    page?: number | null,
  ): Promise<Data> {
    const uri = `/v4/trades/perpetualMarket/${market}`;
    return this.get(uri, {
      createdBeforeOrAtHeight: startingBeforeOrAtHeight,
      createdBeforeOrAt: startingBeforeOrAt,
      limit,
      page,
    });
  }

  async getPerpetualMarketCandles(
    market: string,
    resolution: string,
    fromISO?: string | null,
    toISO?: string | null,
    limit?: number | null,
  ): Promise<Data> {
    const uri = `/v4/candles/perpetualMarkets/${market}`;
    return this.get(uri, {
      resolution,
      fromISO,
      toISO,
      limit,
    });
  }

  async getPerpetualMarketHistoricalFunding(
    market: string,
    effectiveBeforeOrAt?: string | null,
    effectiveBeforeOrAtHeight?: number | null,
    limit?: number | null,
  ): Promise<Data> {
    const uri = `/v4/historicalFunding/${market}`;
    return this.get(uri, {
      effectiveBeforeOrAt,
      effectiveBeforeOrAtHeight,
      limit,
    });
  }

  async getPerpetualMarketSparklines(period: string = TimePeriod.ONE_DAY): Promise<Data> {
    const uri = '/v4/sparklines';
    return this.get(uri, {
      timePeriod: period,
    });
  }
}
