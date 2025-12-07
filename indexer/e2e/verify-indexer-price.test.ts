import pg from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { toPrice, BTC_ASSET, USDC_ASSET, ETH_ASSET } from './utils';

const { Client } = pg;

describe('Verify Prices', () => {
  describe('DB tests', () => {
    let client: pg.Client;
    beforeAll(async () => {
      client = new Client({
        user: process.env.VITE_DB_USER,
        password: process.env.VITE_DB_PASS,
        host: 'localhost',
        port: parseInt(process.env.VITE_DB_PORT ?? '0', 10),
        database: process.env.VITE_DB_NAME,
      });

      await client.connect();
    });

    it('should store correct number of events', async () => {
      const btcResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [
        BTC_ASSET,
      ]);
      const btcRecords = btcResult.rows[0].c;
      expect(btcRecords).toBe('20');

      const usdcResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [
        USDC_ASSET,
      ]);
      const usdcRecords = usdcResult.rows[0].c;
      expect(usdcRecords).toBe('2');

      const ethResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [
        ETH_ASSET,
      ]);
      const ethRecords = ethResult.rows[0].c;
      expect(ethRecords).toBe('2');
    });

    it('should store correct usdc price', async () => {
      const usdcResult = await client.query(
        'SELECT COUNT(*) as c FROM price WHERE asset = $1 and price = $2',
        [USDC_ASSET, toPrice(1)]
      );
      const usdcRecords = usdcResult.rows[0].c;
      expect(usdcRecords).toBe('2');
    });

    it('should store correct eth price', async () => {
      const ethResult = await client.query(
        'SELECT COUNT(*) as c FROM price WHERE asset = $1 and price = $2',
        [ETH_ASSET, toPrice(3000)]
      );
      const ethRecords = ethResult.rows[0].c;
      expect(ethRecords).toBe('2');
    });

    it('should store correct btc price', async () => {
      const btcResult = await client.query(
        'SELECT min(price) as min_price, max(price) as max_price FROM price WHERE asset = $1',
        [BTC_ASSET]
      );
      const btcMinPrice = btcResult.rows[0].min_price;
      const btcMaxPrice = btcResult.rows[0].max_price;
      expect(btcMinPrice).toBe(toPrice(44700));
      expect(btcMaxPrice).toBe(toPrice(45550));
    });

    it('should store correct btc timestamp', async () => {
      const btcResult = await client.query(
        'SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM price WHERE asset = $1',
        [BTC_ASSET]
      );
      const btcMinTimestamp = btcResult.rows[0].min_ts;
      const btcMaxTimestamp = btcResult.rows[0].max_ts;
      const now = Math.floor(Date.now() / 1000);
      // just to be sure, the timestamps do not deviate too much from the current time
      expect(btcMinTimestamp).toBeLessThan(now + 1800);
      expect(btcMinTimestamp).toBeGreaterThan(now - 1800);
      expect(btcMaxTimestamp).toBeLessThan(now + 1800);
      expect(btcMaxTimestamp).toBeGreaterThan(now - 1800);
    });

    it('should store correct btc timestamp spread across events', async () => {
      const btcResult = await client.query(
        'SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM price WHERE asset = $1',
        [BTC_ASSET]
      );
      const btcMinTimestamp = btcResult.rows[0].min_ts;
      const btcMaxTimestamp = btcResult.rows[0].max_ts;
      // 205 is the sum of seconds when moving the blockchain time in the populate-events-price.ts script
      expect(btcMaxTimestamp - btcMinTimestamp).toBeGreaterThanOrEqual(205);
    });

    afterAll(async () => {
      await client.end();
    });
  });
  describe('API tests', () => {
    function getGraphQLURL(query: string) {
      return `http://localhost:${process.env.VITE_GRAPHQL_SERVER_PORT}/graphql?query=query{${query}}`;
    }

    it('should return correct number of price events', async () => {
      const btcURL = getGraphQLURL(`prices(where:{asset_eq:"${BTC_ASSET}"}){id}`);
      const btcResponse = await fetch(btcURL);
      const btcData = await btcResponse.json();
      expect(btcData.data.prices.length).toBe(20);

      const usdcURL = getGraphQLURL(`prices(where:{asset_eq:"${USDC_ASSET}"}){id}`);
      const usdcResponse = await fetch(usdcURL);
      const usdcData = await usdcResponse.json();
      expect(usdcData.data.prices.length).toBe(2);

      const ethURL = getGraphQLURL(`prices(where:{asset_eq:"${ETH_ASSET}"}){id}`);
      const ethResponse = await fetch(ethURL);
      const ethData = await ethResponse.json();
      expect(ethData.data.prices.length).toBe(2);
    });

    it('should return correct usdc price', async () => {
      const usdcURL = getGraphQLURL(`prices(where:{asset_eq:"${USDC_ASSET}"}){price}`);
      const usdcResponse = await fetch(usdcURL);
      const usdcData = await usdcResponse.json();
      expect(usdcData.data.prices.length).toBe(2);
      // All USDC prices should be 1 (toPrice(1))
      usdcData.data.prices.forEach((price: { price: string }) => {
        expect(price.price).toBe(toPrice(1));
      });
    });

    it('should return correct eth price', async () => {
      const ethURL = getGraphQLURL(`prices(where:{asset_eq:"${ETH_ASSET}"}){price}`);
      const ethResponse = await fetch(ethURL);
      const ethData = await ethResponse.json();
      expect(ethData.data.prices.length).toBe(2);
      // All ETH prices should be 3000 (toPrice(3000))
      ethData.data.prices.forEach((price: { price: string }) => {
        expect(price.price).toBe(toPrice(3000));
      });
    });

    it('should store correct btc price', async () => {
      const btcURL = getGraphQLURL(`prices(where:{asset_eq:"${BTC_ASSET}"}){price}`);
      const btcResponse = await fetch(btcURL);
      const btcData = await btcResponse.json();
      expect(btcData.data.prices.length).toBe(20);

      const prices = btcData.data.prices.map((p: { price: string }) => BigInt(p.price));
      const minPrice = prices.reduce((min: bigint, p: bigint) => (p < min ? p : min), prices[0]);
      const maxPrice = prices.reduce((max: bigint, p: bigint) => (p > max ? p : max), prices[0]);

      expect(minPrice.toString()).toBe(toPrice(44700));
      expect(maxPrice.toString()).toBe(toPrice(45550));
    });

    it('should return correct btc timestamps', async () => {
      const btcURL = getGraphQLURL(`prices(where:{asset_eq:"${BTC_ASSET}"}){timestamp}`);
      const btcResponse = await fetch(btcURL);
      const btcData = await btcResponse.json();
      expect(btcData.data.prices.length).toBe(20);

      const timestamps = btcData.data.prices.map((p: { timestamp: number }) => p.timestamp);
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);
      const now = Math.floor(Date.now() / 1000);

      // Timestamps should be within reasonable range from current time
      expect(minTimestamp).toBeLessThan(now + 1800);
      expect(minTimestamp).toBeGreaterThan(now - 1800);
      expect(maxTimestamp).toBeLessThan(now + 1800);
      expect(maxTimestamp).toBeGreaterThan(now - 1800);
    });

    it('should return correct btc timestamp spread across events', async () => {
      const btcURL = getGraphQLURL(`prices(where:{asset_eq:"${BTC_ASSET}"}){timestamp}`);
      const btcResponse = await fetch(btcURL);
      const btcData = await btcResponse.json();
      expect(btcData.data.prices.length).toBe(20);

      const timestamps = btcData.data.prices.map((p: { timestamp: number }) => p.timestamp);
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);

      // 205 is the sum of seconds when moving the blockchain time in the populate-events-price.ts script
      expect(maxTimestamp - minTimestamp).toBeGreaterThanOrEqual(205);
    });
  });
});
