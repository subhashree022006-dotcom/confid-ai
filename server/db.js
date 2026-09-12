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
      reset_token TEXT,
      reset_token_expires_at TIMESTAMP,
      is_admin BOOLEAN DEFAULT FALSE,
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
      video_url TEXT,
      filler_word_count INTEGER,
      speaking_pace_wpm INTEGER,
      star_score INTEGER,
      goals TEXT,
      goals_result TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS video_url TEXT;`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS filler_word_count INTEGER;`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS speaking_pace_wpm INTEGER;`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS star_score INTEGER;`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS goals TEXT;`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS goals_result TEXT;`);

  // ATS Score check history — created after users, since it FK-references users(user_id)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ats_checks (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      resume_filename TEXT,
      job_description TEXT,
      match_score INTEGER,
      missing_keywords JSONB,
      formatting_issues JSONB,
      suggestions JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ats_checks_user_id
    ON ats_checks (user_id, created_at DESC);
  `);

  console.log("Database ready: users, sessions, and ats_checks tables exist");
}