import { TimePeriod } from '../constants';
import { Data } from '../types';
import RestClient from './rest';

/**
 * @description REST endpoints for data unrelated to a particular address.
 */
export default class MarketsClient extends RestClient {
  async getPerpetualMarkets(market?: string): Promise<Data> {
    const uri = '/v4/perpetualMarkets';
    // return this.get(uri, { ticker: "MIRG.BA-USD" });
    return {
      markets: {
        "MIRG.BA-USD": {
          "clobPairId": "0",
          "ticker": "MIRG.BA-USD",
          "status": "ACTIVE",
          "oraclePrice": "1.00",
          "priceChange24H": "-0.48",
          "volume24H": "5799",
          "trades24H": 1,
          "nextFundingRate": "0.0001",
          "initialMarginFraction": "0.10",
          "maintenanceMarginFraction": "0.05",
          "openInterest": "0",
          "atomicResolution": 1,
          "quantumConversionExponent": 1,
          "tickSize": "0.01",
          "stepSize": "0.01",
          "stepBaseQuantums": 1,
          "subticksPerTick": 1,
          "marketType": "CROSS",
          "openInterestLowerCap": "0",
          "openInterestUpperCap": "1000000",
          "baseOpenInterest": "0",
          "defaultFundingRate1H": "0.0001"
        }
      }
    }
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
