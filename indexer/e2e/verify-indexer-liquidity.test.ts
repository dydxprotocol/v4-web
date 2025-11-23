import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { expandDecimals, USER_0_ADDRESS, USER_1_ADDRESS, USER_2_ADDRESS } from "./utils"
import pg from "pg"

const { Pool, Client } = pg

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
        const user0Result = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1', [USER_0_ADDRESS])
        const user0Records = user0Result.rows[0].c
        expect(user0Records).toBe("4") // 2 adds + 2 removes

        const user1Result = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1', [USER_1_ADDRESS])
        const user1Records = user1Result.rows[0].c
        expect(user1Records).toBe("2") // 1 add + 1 remove

        const user2Result = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1', [USER_2_ADDRESS])
        const user2Records = user2Result.rows[0].c
        expect(user2Records).toBe("2") // 2 adds
    })

    it("should store correct latest liquidity for user0", async () => {
        const user0Result = await client.query('SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true', [USER_0_ADDRESS])
        expect(user0Result.rows.length).toBe(1)
        // User0 added 10000 + 3000 = 13000, then removed all, so latest should be 0
        const user0Result2 = await client.query('SELECT sum(stable) AS stable, sum(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1', [USER_0_ADDRESS])
        const user0Liquidity = user0Result2.rows[0]
        expect(user0Liquidity.stable).toBe("0")
        expect(user0Liquidity.lp_amount).toBe("0")
    })

    it("should store correct latest liquidity for user1", async () => {
        const user1Result = await client.query('SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true', [USER_1_ADDRESS])
        expect(user1Result.rows.length).toBe(1)
        // User1 added 5000, then removed all, so latest should be 0
        const user1Result2 = await client.query('SELECT sum(stable) AS stable, sum(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1', [USER_1_ADDRESS])
        const user1Liquidity = user1Result2.rows[0]
        expect(user1Liquidity.stable).toBe("0")
        expect(user1Liquidity.lp_amount).toBe("0")
    })

    it("should store correct latest liquidity for user2", async () => {
        const user2Result = await client.query('SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true', [USER_2_ADDRESS])
        expect(user2Result.rows.length).toBe(1)
        const user2Result2 = await client.query('SELECT sum(stable) AS stable, sum(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1', [USER_2_ADDRESS])
        const user2Liquidity = user2Result2.rows[0]
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

    it("should have total liquidity match final provider state", async () => {
        // Total liquidity should match user2's final state (only provider with remaining liquidity)
        // Note: Total liquidity calculation differs from summing liquidity records because
        // remove events in liquidity records include fees, but total liquidity subtracts
        // stableDetla without fee on remove
        const user2Result = await client.query('SELECT SUM(stable) AS stable, SUM(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1', [USER_2_ADDRESS])
        const totalResult = await client.query('SELECT stable, lp_amount FROM total_liquidity WHERE id = $1', ["1"])

        const user2Stable = BigInt(user2Result.rows[0].stable)
        const user2Lp = BigInt(user2Result.rows[0].lp_amount)
        const totalStable = BigInt(totalResult.rows[0].stable)
        const totalLp = BigInt(totalResult.rows[0].lp_amount)

        // Since user0 and user1 removed all liquidity, total should match user2's positive values
        // User2's latest is an add event (positive), so total should match
        expect(totalStable).toBe(user2Stable)
        expect(totalLp).toBe(user2Lp)
    })

    it("should store correct total liquidity timestamp", async () => {
        const totalResult = await client.query('SELECT last_timestamp FROM total_liquidity WHERE id = $1', ["1"])
        expect(totalResult.rows.length).toBe(1)
        const totalTimestamp = totalResult.rows[0].last_timestamp
        const now = Math.floor(Date.now() / 1000)

        // Timestamp should be recent
        expect(totalTimestamp).toBeLessThan(now + 1800)
        expect(totalTimestamp).toBeGreaterThan(now - 1800)

        // Total liquidity timestamp should match the latest provider liquidity timestamp
        const latestLiquidityResult = await client.query(
            'SELECT max(timestamp) as max_ts FROM liquidity'
        )
        const maxLiquidityTimestamp = latestLiquidityResult.rows[0].max_ts
        expect(totalTimestamp).toBe(maxLiquidityTimestamp)
    })

    it("should have only one total liquidity record", async () => {
        const totalResult = await client.query('SELECT COUNT(*) as c FROM total_liquidity')
        expect(totalResult.rows[0].c).toBe("1")
    })

    it("should have total liquidity with non-negative values", async () => {
        const totalResult = await client.query('SELECT stable, lp_amount FROM total_liquidity WHERE id = $1', ["1"])
        const totalLiquidity = totalResult.rows[0]
        
        expect(BigInt(totalLiquidity.stable)).toBeGreaterThanOrEqual(0)
        expect(BigInt(totalLiquidity.lp_amount)).toBeGreaterThanOrEqual(0)
    })

    it("should store correct liquidity timestamps", async () => {
        const user0Result = await client.query('SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM liquidity WHERE provider = $1', [USER_0_ADDRESS])
        const user0MinTimestamp = user0Result.rows[0].min_ts
        const user0MaxTimestamp = user0Result.rows[0].max_ts
        const now = Math.floor(Date.now() / 1000)
        
        // Timestamps should be recent
        expect(user0MinTimestamp).toBeLessThan(now + 1800)
        expect(user0MinTimestamp).toBeGreaterThan(now - 1800)
        expect(user0MaxTimestamp).toBeLessThan(now + 1800)
        expect(user0MaxTimestamp).toBeGreaterThan(now - 1800)
        
        // Timestamps should span across events (at least 5+10+8+12+7+15 = 57 seconds)
        expect(user0MaxTimestamp - user0MinTimestamp).toBeGreaterThanOrEqual(57)
    })

    it("should have only one latest record per provider", async () => {
        const user0Latest = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true', [USER_0_ADDRESS])
        expect(user0Latest.rows[0].c).toBe("1")

        const user1Latest = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true', [USER_1_ADDRESS])
        expect(user1Latest.rows[0].c).toBe("1")

        const user2Latest = await client.query('SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true', [USER_2_ADDRESS])
        expect(user2Latest.rows[0].c).toBe("1")
    })

    it("should store correct liquidity progression for user0", async () => {
        const user0Result = await client.query('SELECT stable, lp_amount, timestamp FROM liquidity WHERE provider = $1 ORDER BY timestamp ASC', [USER_0_ADDRESS])
        expect(user0Result.rows.length).toBe(4)
        
        // First add: 10000 USDC (after fees, positive value)
        const firstAdd = user0Result.rows[0]
        expect(BigInt(firstAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(9500))) // After fees
        expect(BigInt(firstAdd.stable)).toBeGreaterThan(0) // Positive
        expect(BigInt(firstAdd.lp_amount)).toBeGreaterThan(0) // Positive
        
        // Second add: 3000 USDC (after fees, positive value, not accumulated)
        const secondAdd = user0Result.rows[1]
        expect(BigInt(secondAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(2800))) // After fees
        expect(BigInt(secondAdd.stable)).toBeGreaterThan(0) // Positive
        expect(BigInt(secondAdd.lp_amount)).toBeGreaterThan(0) // Positive
        
        // First remove: negative value (amount removed)
        const firstRemove = user0Result.rows[2]
        expect(BigInt(firstRemove.stable)).toBeLessThan(0) // Negative
        expect(BigInt(firstRemove.lp_amount)).toBeLessThan(0) // Negative
        
        // Second remove: negative value (amount removed)
        const secondRemove = user0Result.rows[3]
        expect(BigInt(secondRemove.stable)).toBeLessThan(0) // Negative
        expect(BigInt(secondRemove.lp_amount)).toBeLessThan(0) // Negative
    })

    afterAll(async () => {
        await client.end()
    })
})

