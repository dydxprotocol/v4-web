import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BTC_ASSET, ETH_ASSET, USDC_ASSET, toPrice } from './utils';

const { Client } = pg;

describe('Verify Prices', () => {
  let client: pg.Client;
  beforeAll(async () => {
    if (
      !process.env.VITE_DB_USER ||
      !process.env.VITE_DB_PASS ||
      !process.env.VITE_DB_PORT ||
      !process.env.VITE_DB_NAME
    ) {
      throw new Error('Environment variables not set');
    }
    client = new Client({
      user: process.env.VITE_DB_USER,
      password: process.env.VITE_DB_PASS,
      host: 'localhost',
      port: parseInt(process.env.VITE_DB_PORT, 10),
      database: process.env.VITE_DB_NAME,
    });

    await client.connect();
  });

  describe('DB tests', () => {
    it('should store correct number of events', async () => {
      const btcResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [
        BTC_ASSET,
      ]);
      const btcRecords = btcResult.rows[0].c;
      expect(btcRecords).toBe('70');

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
      expect(btcMaxPrice).toBe(toPrice(47360));
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
  });
  describe('API tests', () => {
    function getGraphQLURL() {
      return `http://localhost:${process.env.VITE_GRAPHQL_SERVER_PORT}/graphql`;
    }

    async function graphQLPost(query: string) {
      const response = await fetch(getGraphQLURL(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query{${query}}`,
        }),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`GraphQL request failed: ${response.status}: ${responseText}`);
      }
      return response.json();
    }

    it('should return correct number of price events', async () => {
      const btcData = await graphQLPost(`prices(condition:{asset:"${BTC_ASSET}"}){nodes{id}}`);
      expect(btcData.data.prices.nodes.length).toBe(70);

      const usdcData = await graphQLPost(`prices(condition:{asset:"${USDC_ASSET}"}){nodes{id}}`);
      expect(usdcData.data.prices.nodes.length).toBe(2);

      const ethData = await graphQLPost(`prices(condition:{asset:"${ETH_ASSET}"}){nodes{id}}`);
      expect(ethData.data.prices.nodes.length).toBe(2);
    });

    it('should return correct usdc price', async () => {
      const usdcData = await graphQLPost(`prices(condition:{asset:"${USDC_ASSET}"}){nodes{price}}`);
      expect(usdcData.data.prices.nodes.length).toBe(2);
      // All USDC prices should be 1 (toPrice(1))
      usdcData.data.prices.nodes.forEach((price: { price: string }) => {
        expect(price.price).toBe(toPrice(1));
      });
    });

    it('should return correct eth price', async () => {
      const ethData = await graphQLPost(`prices(condition:{asset:"${ETH_ASSET}"}){nodes{price}}`);
      expect(ethData.data.prices.nodes.length).toBe(2);
      // All ETH prices should be 3000 (toPrice(3000))
      ethData.data.prices.nodes.forEach((price: { price: string }) => {
        expect(price.price).toBe(toPrice(3000));
      });
    });

    it('should store correct btc price', async () => {
      const btcData = await graphQLPost(`prices(condition:{asset:"${BTC_ASSET}"}){nodes{price}}`);
      expect(btcData.data.prices.nodes.length).toBe(70);

      const prices = btcData.data.prices.nodes.map((p: { price: string }) => BigInt(p.price));
      const minPrice = prices.reduce((min: bigint, p: bigint) => (p < min ? p : min), prices[0]);
      const maxPrice = prices.reduce((max: bigint, p: bigint) => (p > max ? p : max), prices[0]);

      expect(minPrice.toString()).toBe(toPrice(44700));
      expect(maxPrice.toString()).toBe(toPrice(47360));
    });

    it('should return correct btc timestamps', async () => {
      const btcData = await graphQLPost(
        `prices(condition:{asset:"${BTC_ASSET}"}){nodes{timestamp}}`
      );
      expect(btcData.data.prices.nodes.length).toBe(70);

      const timestamps = btcData.data.prices.nodes.map((p: { timestamp: number }) => p.timestamp);
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
      const btcData = await graphQLPost(
        `prices(condition:{asset:"${BTC_ASSET}"}){nodes{timestamp}}`
      );
      expect(btcData.data.prices.nodes.length).toBe(70);

      const timestamps = btcData.data.prices.nodes.map((p: { timestamp: number }) => p.timestamp);
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);

      // 205 is the sum of seconds when moving the blockchain time in the populate-events-price.ts script
      expect(maxTimestamp - minTimestamp).toBeGreaterThanOrEqual(205);
    });
  });

  afterAll(async () => {
    await client.end();
  });
});
