import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getArgs, moveBlockchainTime, toPrice } from "./utils"
import { BTC_ASSET, USDC_ASSET, ETH_ASSET } from "./utils"
import pg from "pg"

const { Pool, Client } = pg

// adsresses are hardcoded, taken form the fuel node starting script
const deployerAddress = "0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6" //0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
const user0Address = "0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770" //0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
const user1Address = "0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c" //0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
const user2Address = "0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b" //0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b"
const liquidatorAddress = "0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088" //0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088"


describe("Verify Prices", () => {
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

    it("should store corrent number of events", async () => {
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
