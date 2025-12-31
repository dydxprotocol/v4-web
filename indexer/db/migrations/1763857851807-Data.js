export class Data1763857851807 {
  name = 'Data1763857851807';

  async up(db) {
    await db.query(
      `CREATE TABLE "price" ("id" character varying NOT NULL, "asset" text NOT NULL, "timestamp" integer NOT NULL, "price" numeric NOT NULL, CONSTRAINT "PK_d163e55e8cce6908b2e0f27cea4" PRIMARY KEY ("id"))`
    );
    await db.query(`CREATE INDEX "IDX_f0e41cd724226edf5d9b89aa0d" ON "price" ("asset") `);
    await db.query(`CREATE INDEX "IDX_5970068a939d81a9882e19de91" ON "price" ("timestamp") `);
    await db.query(
      `CREATE TABLE "liquidity" ("id" character varying NOT NULL, "provider" text NOT NULL, "stable" numeric NOT NULL, "lp_amount" numeric NOT NULL, "fee" numeric NOT NULL, "timestamp" integer NOT NULL, "latest" boolean NOT NULL, CONSTRAINT "PK_cc7af331aa0cf8bbf8c8ec4f1e5" PRIMARY KEY ("id"))`
    );
    await db.query(`CREATE INDEX "IDX_9f3599bd7e6813aa76c6d96a2a" ON "liquidity" ("provider") `);
    await db.query(
      `CREATE TABLE "total_liquidity" ("id" character varying NOT NULL, "stable" numeric NOT NULL, "lp_amount" numeric NOT NULL, "last_timestamp" integer NOT NULL, CONSTRAINT "PK_370b756e55d566ebbe5c3dbf682" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE TABLE "position_key" ("id" character varying NOT NULL, "account" text NOT NULL, "index_asset_id" text NOT NULL, "is_long" boolean NOT NULL, CONSTRAINT "PK_5d2983a07609414f65f76cff6de" PRIMARY KEY ("id"))`
    );
    await db.query(`CREATE INDEX "IDX_d58a67ef86d17d278df99c28f5" ON "position_key" ("account") `);
    await db.query(
      `CREATE INDEX "IDX_c764b3789b19236ccb6c4159dd" ON "position_key" ("index_asset_id") `
    );
    await db.query(
      `CREATE TABLE "position" ("id" character varying NOT NULL, "collateral_amount" numeric NOT NULL, "size" numeric NOT NULL, "timestamp" integer NOT NULL, "latest" boolean NOT NULL, "change" character varying(9) NOT NULL, "collateral_transferred" numeric NOT NULL, "position_fee" numeric NOT NULL, "funding_rate" numeric NOT NULL, "pnl_delta" numeric NOT NULL, "realized_funding_rate" numeric NOT NULL, "realized_pnl" numeric NOT NULL, "position_key_id" character varying, CONSTRAINT "PK_b7f483581562b4dc62ae1a5b7e2" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_3306a154148b37f510ef9e5daf" ON "position" ("position_key_id") `
    );
    await db.query(
      `CREATE TABLE "total_position" ("id" character varying NOT NULL, "index_asset_id" text NOT NULL, "is_long" boolean NOT NULL, "collateral_amount" numeric NOT NULL, "size" numeric NOT NULL, "last_timestamp" integer NOT NULL, CONSTRAINT "PK_0235342f5c87dcfa198b732d7a4" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_563a960fee18d232545cb34566" ON "total_position" ("index_asset_id") `
    );
    await db.query(
      `ALTER TABLE "position" ADD CONSTRAINT "FK_3306a154148b37f510ef9e5daf4" FOREIGN KEY ("position_key_id") REFERENCES "position_key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  async down(db) {
    await db.query(`DROP TABLE "price"`);
    await db.query(`DROP INDEX "public"."IDX_f0e41cd724226edf5d9b89aa0d"`);
    await db.query(`DROP INDEX "public"."IDX_5970068a939d81a9882e19de91"`);
    await db.query(`DROP TABLE "liquidity"`);
    await db.query(`DROP INDEX "public"."IDX_9f3599bd7e6813aa76c6d96a2a"`);
    await db.query(`DROP TABLE "total_liquidity"`);
    await db.query(`DROP TABLE "position_key"`);
    await db.query(`DROP INDEX "public"."IDX_d58a67ef86d17d278df99c28f5"`);
    await db.query(`DROP INDEX "public"."IDX_c764b3789b19236ccb6c4159dd"`);
    await db.query(`DROP TABLE "position"`);
    await db.query(`DROP INDEX "public"."IDX_3306a154148b37f510ef9e5daf"`);
    await db.query(`DROP TABLE "total_position"`);
    await db.query(`DROP INDEX "public"."IDX_563a960fee18d232545cb34566"`);
    await db.query(`ALTER TABLE "position" DROP CONSTRAINT "FK_3306a154148b37f510ef9e5daf4"`);
  }
}
