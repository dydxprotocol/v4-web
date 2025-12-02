import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getArgs, moveBlockchainTime, toPrice } from "./utils"
import { BTC_ASSET, USDC_ASSET, ETH_ASSET } from "./utils"
import pg from "pg"

const { Pool, Client } = pg

describe("Verify Prices", () => {
    describe("DB tests", () => {
        let client: pg.Client
        beforeAll(async () => {
            client = new Client({
                user: import.meta['env']['VITE_DB_USER'],
                password: import.meta['env']['VITE_DB_PASS'],
                host: 'localhost',
                port: import.meta['env']['VITE_DB_PORT'],
                database: import.meta['env']['VITE_DB_NAME'],
              })
               
            await client.connect()    
        })
    
        it("should store correct number of events", async () => {
            const btcResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [BTC_ASSET])
            const btcRecords = btcResult.rows[0].c
            expect(btcRecords).toBe("20")
    
            const usdcResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [USDC_ASSET])
            const usdcRecords = usdcResult.rows[0].c
            expect(usdcRecords).toBe("2")
    
            const ethResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1', [ETH_ASSET])
            const ethRecords = ethResult.rows[0].c
            expect(ethRecords).toBe("2")
        })
    
    
        it("should store correct usdc price", async () => {
            const usdcResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1 and price = $2', [USDC_ASSET, toPrice(1)])
            const usdcRecords = usdcResult.rows[0].c
            expect(usdcRecords).toBe("2")
        })
        
        it("should store correct eth price", async () => {
            const ethResult = await client.query('SELECT COUNT(*) as c FROM price WHERE asset = $1 and price = $2', [ETH_ASSET, toPrice(3000)])
            const ethRecords = ethResult.rows[0].c
            expect(ethRecords).toBe("2")
        })
            
        it("should store correct btc price", async () => {
            const btcResult = await client.query('SELECT min(price) as min_price, max(price) as max_price FROM price WHERE asset = $1', [BTC_ASSET])
            const btcMinPrice = btcResult.rows[0].min_price
            const btcMaxPrice = btcResult.rows[0].max_price
            expect(btcMinPrice).toBe(toPrice(44700))
            expect(btcMaxPrice).toBe(toPrice(45550))
        })
            
        it("should store correct btc timestamp", async () => {
            const btcResult = await client.query('SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM price WHERE asset = $1', [BTC_ASSET])
            const btcMinTimestamp = btcResult.rows[0].min_ts
            const btcMaxTimestamp = btcResult.rows[0].max_ts
            const now = Math.floor(Date.now() / 1000);
            // just to be sure, the timestamps do not deviate too much from the current time
            expect(btcMinTimestamp).toBeLessThan(now + 1800)
            expect(btcMinTimestamp).toBeGreaterThan(now - 1800)
            expect(btcMaxTimestamp).toBeLessThan(now + 1800)
            expect(btcMaxTimestamp).toBeGreaterThan(now - 1800)
        })
    
        it("should store correct btc timestamp spread across events", async () => {
            const btcResult = await client.query('SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM price WHERE asset = $1', [BTC_ASSET])
            const btcMinTimestamp = btcResult.rows[0].min_ts
            const btcMaxTimestamp = btcResult.rows[0].max_ts
            // 205 is the sum of seconds when moving the blockchain time in the populate-events-price.ts script
            expect(btcMaxTimestamp - btcMinTimestamp).toBeGreaterThanOrEqual(205)
        })
    
        afterAll(async () => {
            await client.end()
        })
    })
    describe("API tests", () => {
        it.skip("should return correct btc price", async () => {
            const response = await fetch(`http://localhost:4350/graphql?query=query{prices(where:{asset_eq:"${BTC_ASSET}"}){timestamp}}`)
            // console.log(response)
            const data = await response.json()
            // console.log("data")
            // console.log(data)
            expect(data.data.prices.length).toBe(20)
        })
    })
})
