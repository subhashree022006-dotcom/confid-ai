import { pool } from "./db.js";

// Add any new ALTER TABLE statements here whenever you add columns to db.js.
// Safe to re-run anytime - IF NOT EXISTS means it wont break if already applied.

async function migrate() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id_url TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id_status TEXT DEFAULT 'none';`);
    console.log("Migration complete - all columns verified/added.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrate();
