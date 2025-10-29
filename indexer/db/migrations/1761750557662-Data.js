module.exports = class Data1761750557662 {
    name = 'Data1761750557662'

    async up(db) {
        await db.query(`DROP INDEX "public"."IDX_8dab9c31a2ebc917e584111575"`)
        await db.query(`ALTER TABLE "price" RENAME COLUMN "asset_id" TO "asset"`)
        await db.query(`ALTER TABLE "position" ADD "latest" boolean NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "change" character varying(9) NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "collateral_transferred" text NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "position_fee" text NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "funding_rate" text NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "pnl_delta" text NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "realized_funding_rate" text NOT NULL`)
        await db.query(`ALTER TABLE "position" ADD "realized_pnl" text NOT NULL`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "collateral_amout"`)
        await db.query(`ALTER TABLE "position" ADD "collateral_amout" text NOT NULL`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "size"`)
        await db.query(`ALTER TABLE "position" ADD "size" text NOT NULL`)
        await db.query(`ALTER TABLE "total_position" DROP COLUMN "collateral_amout"`)
        await db.query(`ALTER TABLE "total_position" ADD "collateral_amout" text NOT NULL`)
        await db.query(`ALTER TABLE "total_position" DROP COLUMN "size"`)
        await db.query(`ALTER TABLE "total_position" ADD "size" text NOT NULL`)
        await db.query(`CREATE INDEX "IDX_f0e41cd724226edf5d9b89aa0d" ON "price" ("asset") `)
    }

    async down(db) {
        await db.query(`CREATE INDEX "IDX_8dab9c31a2ebc917e584111575" ON "price" ("asset_id") `)
        await db.query(`ALTER TABLE "price" RENAME COLUMN "asset" TO "asset_id"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "latest"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "change"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "collateral_transferred"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "position_fee"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "funding_rate"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "pnl_delta"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "realized_funding_rate"`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "realized_pnl"`)
        await db.query(`ALTER TABLE "position" ADD "collateral_amout" numeric NOT NULL`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "collateral_amout"`)
        await db.query(`ALTER TABLE "position" ADD "size" numeric NOT NULL`)
        await db.query(`ALTER TABLE "position" DROP COLUMN "size"`)
        await db.query(`ALTER TABLE "total_position" ADD "collateral_amout" numeric NOT NULL`)
        await db.query(`ALTER TABLE "total_position" DROP COLUMN "collateral_amout"`)
        await db.query(`ALTER TABLE "total_position" ADD "size" numeric NOT NULL`)
        await db.query(`ALTER TABLE "total_position" DROP COLUMN "size"`)
        await db.query(`DROP INDEX "public"."IDX_f0e41cd724226edf5d9b89aa0d"`)
    }
}
