import { pool } from "./db.js";

async function migrate() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id_url TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id_status TEXT DEFAULT 'none';`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`);
    console.log("Migration complete - all columns verified/added.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrate();
