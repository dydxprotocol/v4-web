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

        // Load emerging markets data from JSON file
        try {
            const response = await fetch('/emerging_markets.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch emerging markets: ${response.status}`);
            }
            const emergingMarkets = await response.json();
            return emergingMarkets;
        } catch (error) {
            console.error('Error loading emerging markets:', error);
            // Fallback to empty markets if JSON loading fails
            return { markets: {} };
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
