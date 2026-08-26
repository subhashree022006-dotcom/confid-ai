import pg from "pg";
import dotenv from "dotenv";
import dns from "dns";
import net from "net";
dotenv.config();

dns.setDefaultResultOrder("ipv4first");
if (typeof net.setDefaultAutoSelectFamily === "function") {
  net.setDefaultAutoSelectFamily(false);
}

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      plan_expires_at TIMESTAMP,
      student_id_url TEXT,
      student_id_status TEXT DEFAULT 'none',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      topic_or_role TEXT,
      overall_score INTEGER,
      confidence INTEGER,
      eye_contact INTEGER,
      gesture INTEGER,
      communication INTEGER,
      hire_probability INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("Database ready: users and sessions tables exist");
}
