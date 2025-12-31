// NON GENERATED MIGRATION
export class Data1763857851809 {
  name = 'Data1763857851809';

  async up(db) {
    await db.query(
      `CREATE TABLE "current_price" ("asset" text NOT NULL, "timestamp" integer NOT NULL, "price" numeric NOT NULL, PRIMARY KEY ("asset"))`
    );
    await db.query(`
CREATE OR REPLACE FUNCTION current_price_update() RETURNS TRIGGER AS $$
DECLARE
    v_cnt integer;
BEGIN
   INSERT INTO current_price VALUES(NEW.asset, NEW.timestamp, NEW.price)
      ON CONFLICT(asset)
      DO UPDATE SET timestamp = NEW.timestamp, price = NEW.price
      WHERE current_price.timestamp < NEW.timestamp;
   GET DIAGNOSTICS v_cnt = ROW_COUNT;
   IF v_cnt > 0 THEN
      PERFORM pg_notify('starboard:price:'||SUBSTRING(NEW.asset, 1, 42), json_build_object('asset', NEW.asset, 'timestamp', NEW.timestamp, 'price', NEW.price)::text);
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql`);
    await db.query(`
CREATE OR REPLACE TRIGGER current_price_update_trigger
AFTER INSERT ON price
FOR EACH ROW
EXECUTE FUNCTION current_price_update()`);
  }

  async down(db) {
    await db.query(`DROP TRIGGER current_price_update_trigger ON price`);
    await db.query(`DROP FUNCTION current_price_update()`);
    await db.query(`DROP TABLE "current_price"`);
  }
}
