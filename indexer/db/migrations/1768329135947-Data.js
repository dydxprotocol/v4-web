export default class Data1768329135947 {
    name = 'Data1768329135947'

    async up(db) {
        await db.query(`CREATE TABLE "price" ("id" character varying NOT NULL, "asset" text NOT NULL, "timestamp" integer NOT NULL, "price" numeric NOT NULL, CONSTRAINT "PK_d163e55e8cce6908b2e0f27cea4" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_c70fa4f1953ea41d18d7cfc3c2" ON "price" ("asset", "timestamp") `)
        await db.query(`CREATE TABLE "liquidity" ("id" character varying NOT NULL, "timestamp" integer NOT NULL, "latest" boolean NOT NULL, "lp_asset_balance" numeric NOT NULL, "account" text NOT NULL, "base_asset" numeric NOT NULL, "liquidity" numeric NOT NULL, "lp_asset" numeric NOT NULL, "fee" numeric NOT NULL, CONSTRAINT "PK_cc7af331aa0cf8bbf8c8ec4f1e5" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_7035ee47c646130e2dbfe5f185" ON "liquidity" ("account") `)
        await db.query(`CREATE TABLE "position_key" ("id" character varying NOT NULL, "account" text NOT NULL, "index_asset_id" text NOT NULL, "is_long" boolean NOT NULL, CONSTRAINT "PK_5d2983a07609414f65f76cff6de" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_d58a67ef86d17d278df99c28f5" ON "position_key" ("account") `)
        await db.query(`CREATE INDEX "IDX_c764b3789b19236ccb6c4159dd" ON "position_key" ("index_asset_id") `)
        await db.query(`CREATE TABLE "position" ("id" character varying NOT NULL, "change" character varying(9) NOT NULL, "timestamp" integer NOT NULL, "latest" boolean NOT NULL, "collateral" numeric NOT NULL, "size" numeric NOT NULL, "out_average_price" numeric NOT NULL, "realized_funding_rate" numeric NOT NULL, "realized_pnl" numeric NOT NULL, "collateral_delta" numeric NOT NULL, "size_delta" numeric NOT NULL, "out_liquidity_fee" numeric NOT NULL, "out_protocol_fee" numeric NOT NULL, "out_liquidation_fee" numeric NOT NULL, "funding_rate" numeric NOT NULL, "out_funding_rate" numeric NOT NULL, "pnl_delta" numeric NOT NULL, "out_pnl_delta" numeric NOT NULL, "out_amount" numeric NOT NULL, "position_key_id" character varying, CONSTRAINT "PK_b7f483581562b4dc62ae1a5b7e2" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_3306a154148b37f510ef9e5daf" ON "position" ("position_key_id") `)
        await db.query(`ALTER TABLE "position" ADD CONSTRAINT "FK_3306a154148b37f510ef9e5daf4" FOREIGN KEY ("position_key_id") REFERENCES "position_key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "position" DROP CONSTRAINT "FK_3306a154148b37f510ef9e5daf4"`)
        await db.query(`DROP INDEX "public"."IDX_3306a154148b37f510ef9e5daf"`)
        await db.query(`DROP TABLE "position"`)
        await db.query(`DROP INDEX "public"."IDX_c764b3789b19236ccb6c4159dd"`)
        await db.query(`DROP INDEX "public"."IDX_d58a67ef86d17d278df99c28f5"`)
        await db.query(`DROP TABLE "position_key"`)
        await db.query(`DROP INDEX "public"."IDX_7035ee47c646130e2dbfe5f185"`)
        await db.query(`DROP TABLE "liquidity"`)
        await db.query(`DROP INDEX "public"."IDX_c70fa4f1953ea41d18d7cfc3c2"`)
        await db.query(`DROP TABLE "price"`)
    }
}
