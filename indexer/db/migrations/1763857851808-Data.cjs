// NON GENERATED MIGRATION
module.exports = class Data1763857851808 {
  name = 'Data1763857851808';

  async up(db) {
    await db.query(`CREATE INDEX "IDX_price_asset_timestamp" ON "price" ("asset", "timestamp") `);
    await db.query(
      `CREATE VIEW "candle_m1" AS SELECT asset, period*60 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/60 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
    await db.query(
      `CREATE VIEW "candle_m5" AS SELECT asset, period*300 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/300 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
    await db.query(
      `CREATE VIEW "candle_m15" AS SELECT asset, period*900 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/900 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
    await db.query(
      `CREATE VIEW "candle_m30" AS SELECT asset, period*1800 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/1800 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
    await db.query(
      `CREATE VIEW "candle_h1" AS SELECT asset, period*3600 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/3600 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
    await db.query(
      `CREATE VIEW "candle_h4" AS SELECT asset, period*14400 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/14400 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
    await db.query(
      `CREATE VIEW "candle_d1" AS SELECT asset, period*86400 AS started_at, min(price) AS low_price, MAX(price) AS high_price, MIN(price) FILTER (WHERE rn=1) AS close_price FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY asset, period ORDER BY timestamp DESC) AS rn FROM (SELECT p.price, p.asset, p.timestamp, p.timestamp/86400 AS period FROM price p) pp) ppp GROUP BY asset, period`
    );
  }

  async down(db) {
    await db.query(`DROP VIEW "candle_m1"`);
    await db.query(`DROP VIEW "candle_m5"`);
    await db.query(`DROP VIEW "candle_m15"`);
    await db.query(`DROP VIEW "candle_m30"`);
    await db.query(`DROP VIEW "candle_h1"`);
    await db.query(`DROP VIEW "candle_h4"`);
    await db.query(`DROP VIEW "candle_d1"`);
    await db.query(`DROP INDEX "public"."IDX_price_asset_timestamp"`);
  }
};
