// NON GENERATED MIGRATION
export default class Data1768329135950 {
  name = 'Data1768329135950';

  async up(db) {
    await db.query(`CREATE TABLE "current_position" ("position_id" character varying NOT NULL, "change" character varying(9) NOT NULL, "timestamp" integer NOT NULL, "collateral" numeric NOT NULL, "size" numeric NOT NULL, "out_average_price" numeric NOT NULL, "position_open_id" character varying NOT NULL UNIQUE, "position_key_id" character varying, CONSTRAINT "PK_CURRENT_POSITION" PRIMARY KEY ("position_key_id"))`);
    await db.query(`
      CREATE OR REPLACE FUNCTION current_position_update() RETURNS TRIGGER AS $$
      BEGIN
         IF NEW.latest = TRUE THEN
            IF NEW.change = 'CLOSE' OR NEW.change = 'LIQUIDATE' OR NEW.size = 0 THEN
               DELETE FROM current_position WHERE position_key_id = NEW.position_key_id;
            ELSE
               INSERT INTO current_position VALUES(NEW.id, NEW.change, NEW.timestamp, NEW.collateral, NEW.size, NEW.out_average_price, NEW.open_id, NEW.position_key_id)
                  ON CONFLICT(position_key_id)
                  DO UPDATE SET position_id = NEW.id, change = NEW.change, timestamp = NEW.timestamp, collateral = NEW.collateral, size = NEW.size, out_average_price = NEW.out_average_price;
            END IF;
         END IF;
         RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`);
          await db.query(`
      CREATE OR REPLACE TRIGGER current_position_update_trigger
      AFTER INSERT ON position
      FOR EACH ROW
      EXECUTE FUNCTION current_position_update()`);
        }

  async down(db) {
    await db.query(`DROP TRIGGER current_position_update_trigger ON position`);
    await db.query(`DROP FUNCTION current_position_update()`);
    await db.query(`DROP TABLE "current_position"`);
  }
}
