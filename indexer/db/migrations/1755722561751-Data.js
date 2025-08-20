module.exports = class Data1755722561751 {
    name = 'Data1755722561751'

    async up(db) {
        await db.query(`CREATE TABLE "contract" ("id" character varying NOT NULL, "logs_count" integer NOT NULL, "found_at" integer NOT NULL, CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "trade" ("id" character varying NOT NULL, "created_at_height" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE, "side" character varying(4), "price" numeric, "size" numeric, "trade_type" character varying(11), "market_id" character varying, "position_id" character varying, CONSTRAINT "PK_d4097908741dc408f8274ebdc53" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_feeaee6c44821a3b81cd1c114b" ON "trade" ("market_id") `)
        await db.query(`CREATE INDEX "IDX_37ae311c8c7eac8b0e99b0eb9f" ON "trade" ("position_id") `)
        await db.query(`CREATE TABLE "payment" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE, "created_at_height" integer, "ticker" text, "oracle_price" numeric, "size" numeric, "side" character varying(5), "rate" numeric, "payment" numeric, "subaccount_number" integer, "funding_index" numeric, "type" character varying(8), "position_id" character varying, "market_id" character varying, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_beb52b3caaf6ad553308bd2368" ON "payment" ("position_id") `)
        await db.query(`CREATE INDEX "IDX_002d5dd510c6b58d452343fe5e" ON "payment" ("market_id") `)
        await db.query(`CREATE TABLE "market" ("id" character varying NOT NULL, "atomic_resolution" integer NOT NULL, "base_open_interest" text NOT NULL, "default_funding_rate1_h" numeric NOT NULL, "initial_margin_fraction" numeric NOT NULL, "maintenance_margin_fraction" numeric NOT NULL, "market_type" character varying(4) NOT NULL, "next_funding_rate" numeric NOT NULL, "open_interest" numeric NOT NULL, "open_interest_lower_cap" numeric, "open_interest_upper_cap" numeric, "oracle_price" numeric, "price_change24_h" numeric NOT NULL, "quantum_conversion_exponent" integer NOT NULL, "status" character varying(15) NOT NULL, "step_base_quantums" numeric NOT NULL, "step_size" numeric NOT NULL, "subticks_per_tick" integer NOT NULL, "tick_size" numeric NOT NULL, "ticker" text NOT NULL, "trades24_h" numeric NOT NULL, "volume24_h" numeric NOT NULL, "clob_pair_id" integer, "candles" jsonb, CONSTRAINT "PK_1e9a2963edfd331d92018e3abac" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "position" ("id" character varying NOT NULL, "status" character varying(10), "side" character varying(5), "size" numeric, "max_size" numeric, "entry_price" numeric, "exit_price" numeric, "realized_pnl" numeric, "created_at" TIMESTAMP WITH TIME ZONE, "created_at_height" integer, "sum_open" numeric, "sum_close" numeric, "net_funding" numeric, "unrealized_pnl" numeric, "closed_at" TIMESTAMP WITH TIME ZONE, "subaccount_number" integer, "ticker" text, "collateral" numeric, "position_fees" numeric, "entry_funding_rate" numeric, "reserve_amount" numeric, "last_increased_time" TIMESTAMP WITH TIME ZONE, "account_id" character varying, "market_id" character varying, CONSTRAINT "PK_b7f483581562b4dc62ae1a5b7e2" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_6efee800156963ad38b297b30e" ON "position" ("account_id") `)
        await db.query(`CREATE INDEX "IDX_d744886149158961e1b796182f" ON "position" ("market_id") `)
        await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, "address" text, "subaccount_number" integer, "subaccount_id" text, "is_liquidator" boolean, "is_handler" boolean, "is_manager" boolean, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "asset" ("id" character varying NOT NULL, "decimals" integer, "whitelisted" boolean, "stable" boolean, "shortable" boolean, "min_profit_basis_points" integer, "weight" numeric, "feed_id" text, "price" numeric, CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`)
        await db.query(`ALTER TABLE "trade" ADD CONSTRAINT "FK_feeaee6c44821a3b81cd1c114b5" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "trade" ADD CONSTRAINT "FK_37ae311c8c7eac8b0e99b0eb9ff" FOREIGN KEY ("position_id") REFERENCES "position"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_beb52b3caaf6ad553308bd23687" FOREIGN KEY ("position_id") REFERENCES "position"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_002d5dd510c6b58d452343fe5e5" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "position" ADD CONSTRAINT "FK_6efee800156963ad38b297b30e9" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "position" ADD CONSTRAINT "FK_d744886149158961e1b796182f8" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "contract"`)
        await db.query(`DROP TABLE "trade"`)
        await db.query(`DROP INDEX "public"."IDX_feeaee6c44821a3b81cd1c114b"`)
        await db.query(`DROP INDEX "public"."IDX_37ae311c8c7eac8b0e99b0eb9f"`)
        await db.query(`DROP TABLE "payment"`)
        await db.query(`DROP INDEX "public"."IDX_beb52b3caaf6ad553308bd2368"`)
        await db.query(`DROP INDEX "public"."IDX_002d5dd510c6b58d452343fe5e"`)
        await db.query(`DROP TABLE "market"`)
        await db.query(`DROP TABLE "position"`)
        await db.query(`DROP INDEX "public"."IDX_6efee800156963ad38b297b30e"`)
        await db.query(`DROP INDEX "public"."IDX_d744886149158961e1b796182f"`)
        await db.query(`DROP TABLE "account"`)
        await db.query(`DROP TABLE "asset"`)
        await db.query(`ALTER TABLE "trade" DROP CONSTRAINT "FK_feeaee6c44821a3b81cd1c114b5"`)
        await db.query(`ALTER TABLE "trade" DROP CONSTRAINT "FK_37ae311c8c7eac8b0e99b0eb9ff"`)
        await db.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_beb52b3caaf6ad553308bd23687"`)
        await db.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_002d5dd510c6b58d452343fe5e5"`)
        await db.query(`ALTER TABLE "position" DROP CONSTRAINT "FK_6efee800156963ad38b297b30e9"`)
        await db.query(`ALTER TABLE "position" DROP CONSTRAINT "FK_d744886149158961e1b796182f8"`)
    }
}
