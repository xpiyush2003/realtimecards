import "dotenv/config";
import pg from "pg";

// keep DATE columns as "YYYY-MM-DD" strings
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);
// SUM and COUNT come back as bigint, turn them into numbers
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// runs the callback inside one transaction
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
