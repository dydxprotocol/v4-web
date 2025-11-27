import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { BNB_ASSET, expandDecimals, getArgs, moveBlockchainTime, toPrice } from "./utils"
import { BTC_ASSET, USDC_ASSET, ETH_ASSET } from "./utils"
import { USER_0_ADDRESS } from "./utils"
import pg from "pg"

const { Pool, Client } = pg

describe("Verify Positions", () => {
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

    it("should find correct total positions", async () => {
        const totalPositionBTCLongResult = await client.query('SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2', [BTC_ASSET, true])
        const totalPositionBTCShortResult = await client.query('SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2', [BTC_ASSET, false])
        const totalPositionETHLongResult = await client.query('SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2', [ETH_ASSET, true])
        const totalPositionETHShortResult = await client.query('SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2', [ETH_ASSET, false])
        const totalPositionBNBLongResult = await client.query('SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2', [BNB_ASSET, true])
        const totalPositionBNBShortResult = await client.query('SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2', [BNB_ASSET, false])
        
        expect(totalPositionBTCLongResult.rows.length).toBe(1)
        expect(totalPositionBTCShortResult.rows.length).toBe(1)
        expect(totalPositionETHLongResult.rows.length).toBe(1)
        expect(totalPositionETHShortResult.rows.length).toBe(0)
        expect(totalPositionBNBLongResult.rows.length).toBe(1)
        expect(totalPositionBNBShortResult.rows.length).toBe(0)

        expect(totalPositionBTCLongResult.rows[0].size).toBe(expandDecimals(1000))
        expect(totalPositionBTCShortResult.rows[0].size).toBe(expandDecimals(1000))
        expect(totalPositionETHLongResult.rows[0].size).toBe(expandDecimals(3000))
        expect(totalPositionBNBLongResult.rows[0].size).toBe("0")
    })

    it("should position key be unique", async () => {
        const positionKeyResult = await client.query('SELECT COUNT(1) as c FROM position_key GROUP BY account, index_asset_id, is_long HAVING COUNT(1) > 1')
        // Postgres returns no rows instead of 0 value
        expect(positionKeyResult.rows.length).toBe(0)
    })

    it("should be the the correct count of BNB closed positions", async () => {
        const positionKeyResult = await client.query('SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3', [USER_0_ADDRESS, BNB_ASSET, true])
        const positionKeyId = positionKeyResult.rows[0].id
        const closedPositionBNBResult = await client.query('SELECT * FROM position WHERE position_key_id = $1 AND change = $2', [positionKeyId, "CLOSE"])
        expect(closedPositionBNBResult.rows.length).toBe(2)
    })

    it("should BNB positions have the same position key", async () => {
        const positionBNBResult = await client.query('SELECT COUNT(DISTINCT position_key_id) as c FROM position WHERE position_key_id in (SELECT id FROM position_key WHERE position_key.index_asset_id = $1)', [BNB_ASSET])
        expect(positionBNBResult.rows[0].c).toBe("1")
    })

    it("should be exactly 1 latest position for each position key", async () => {
        // position keys with more than 1 latest position
        const positionKeyResult = await client.query('SELECT position_key.id AS c FROM position_key LEFT JOIN position ON position_key.id = position.position_key_id AND position.latest = TRUE GROUP BY position_key.id HAVING COUNT(1) <> 1')
        expect(positionKeyResult.rows.length).toBe(0)
    })

    it("should be two BTC positions", async () => {
        // one position is long, one is short
        const positionKeyResult = await client.query('SELECT account, is_long FROM position_key WHERE index_asset_id = $1', [BTC_ASSET])
        expect(positionKeyResult.rows.length).toBe(2)
        expect(positionKeyResult.rows[0].account).not.toBe(positionKeyResult.rows[1].account)
        expect(positionKeyResult.rows[0].is_long).not.toBe(positionKeyResult.rows[1].is_long)
    })

    it("should closed positions have no size", async () => {
        const closedPositionResult = await client.query('SELECT id FROM position WHERE change = $1 AND size <> 0', ["CLOSE"])
        expect(closedPositionResult.rows.length).toBe(0)
    })

    it("should positions with no size be closed", async () => {
        const closedPositionResult = await client.query('SELECT id FROM position WHERE change <> $1 AND size = 0', ["CLOSE"])
        expect(closedPositionResult.rows.length).toBe(0)
    })

    it("should positions with no size have no collateral", async () => {
        const closedPositionResult = await client.query('SELECT id FROM position WHERE size = 0 AND collateral_amount <> 0')
        expect(closedPositionResult.rows.length).toBe(0)
    })

    it("should positions with no collateral have no size", async () => {
        const closedPositionResult = await client.query('SELECT id FROM position WHERE collateral_amount = 0 AND size <> 0')
        expect(closedPositionResult.rows.length).toBe(0)
    })
    
    afterAll(async () => {
        await client.end()
    })
})
