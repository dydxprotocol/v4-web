import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { expandDecimals } from "./utils"
import pg from "pg"

const { Pool, Client } = pg

// addresses are hardcoded, taken from the fuel node starting script
const user0Address = "0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
const user1Address = "0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
const user2Address = "0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b"


describe("Verify Liquidity", () => {
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

    it("should store correct number of liquidity events", async () => {
        const user0Result = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1', [user0Address])
        const user0Records = user0Result.rows[0].c
        expect(user0Records).toBe("4") // 2 adds + 2 removes

        const user1Result = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1', [user1Address])
        const user1Records = user1Result.rows[0].c
        expect(user1Records).toBe("2") // 1 add + 1 remove

        const user2Result = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1', [user2Address])
        const user2Records = user2Result.rows[0].c
        expect(user2Records).toBe("2") // 2 adds
    })

    it("should store correct latest liquidity for user0", async () => {
        const user0Result = await client.query('SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true', [user0Address])
        expect(user0Result.rows.length).toBe(1)
        const user0Liquidity = user0Result.rows[0]
        // User0 added 10000 + 3000 = 13000, then removed all, so latest should be 0
        expect(user0Liquidity.stable).toBe("0")
        expect(user0Liquidity.lp_amount).toBe("0")
    })

    it("should store correct latest liquidity for user1", async () => {
        const user1Result = await client.query('SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true', [user1Address])
        expect(user1Result.rows.length).toBe(1)
        const user1Liquidity = user1Result.rows[0]
        // User1 added 5000, then removed all, so latest should be 0
        expect(user1Liquidity.stable).toBe("0")
        expect(user1Liquidity.lp_amount).toBe("0")
    })

    it("should store correct latest liquidity for user2", async () => {
        const user2Result = await client.query('SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true', [user2Address])
        expect(user2Result.rows.length).toBe(1)
        const user2Liquidity = user2Result.rows[0]
        // User2 added 7000 + 2000 = 9000, so latest should be around 9000 (minus fees)
        // Note: Due to fees, the exact amount might be slightly less
        const stableAmount = BigInt(user2Liquidity.stable)
        expect(stableAmount).toBeGreaterThan(BigInt(expandDecimals(8500))) // At least 8500 after fees
        expect(stableAmount).toBeLessThanOrEqual(BigInt(expandDecimals(9000)))
        expect(BigInt(user2Liquidity.lp_amount)).toBeGreaterThan(0)
    })

    it("should store correct total liquidity", async () => {
        const totalResult = await client.query('SELECT stable, lp_amount FROM total_liquidity WHERE id = $1', ["1"])
        expect(totalResult.rows.length).toBe(1)
        const totalLiquidity = totalResult.rows[0]
        // Total should be user2's liquidity (9000 minus fees)
        const stableAmount = BigInt(totalLiquidity.stable)
        expect(stableAmount).toBeGreaterThan(BigInt(expandDecimals(8500)))
        expect(stableAmount).toBeLessThanOrEqual(BigInt(expandDecimals(9000)))
        expect(BigInt(totalLiquidity.lp_amount)).toBeGreaterThan(0)
    })

    it("should store correct liquidity timestamps", async () => {
        const user0Result = await client.query('SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM liquidity WHERE provider = $1', [user0Address])
        const user0MinTimestamp = user0Result.rows[0].min_ts
        const user0MaxTimestamp = user0Result.rows[0].max_ts
        const now = Math.floor(Date.now() / 1000)
        
        // Timestamps should be recent
        expect(user0MinTimestamp).toBeLessThan(now + 1800)
        expect(user0MinTimestamp).toBeGreaterThan(now - 1800)
        expect(user0MaxTimestamp).toBeLessThan(now + 1800)
        expect(user0MaxTimestamp).toBeGreaterThan(now - 1800)
        
        // Timestamps should span across events (at least 5+10+8+12+7+15+9+11 = 77 seconds)
        expect(user0MaxTimestamp - user0MinTimestamp).toBeGreaterThanOrEqual(77)
    })

    it("should have only one latest record per provider", async () => {
        const user0Latest = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true', [user0Address])
        expect(user0Latest.rows[0].c).toBe("1")

        const user1Latest = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true', [user1Address])
        expect(user1Latest.rows[0].c).toBe("1")

        const user2Latest = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true', [user2Address])
        expect(user2Latest.rows[0].c).toBe("1")
    })

    it("should store correct liquidity progression for user0", async () => {
        const user0Result = await client.query('SELECT stable, lp_amount, timestamp FROM liquidity WHERE provider = $1 ORDER BY timestamp ASC', [user0Address])
        expect(user0Result.rows.length).toBe(4)
        
        // First add: 10000 USDC
        const firstAdd = user0Result.rows[0]
        expect(BigInt(firstAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(9500))) // After fees
        expect(BigInt(firstAdd.lp_amount)).toBeGreaterThan(0)
        
        // Second add: should accumulate (10000 + 3000)
        const secondAdd = user0Result.rows[1]
        expect(BigInt(secondAdd.stable)).toBeGreaterThan(BigInt(expandDecimals(12000)))
        
        // First remove: should decrease
        const firstRemove = user0Result.rows[2]
        expect(BigInt(firstRemove.stable)).toBeLessThan(BigInt(secondAdd.stable))
        
        // Second remove: should be 0
        const secondRemove = user0Result.rows[3]
        expect(secondRemove.stable).toBe("0")
        expect(secondRemove.lp_amount).toBe("0")
    })

    afterAll(async () => {
        await client.end()
    })
})

