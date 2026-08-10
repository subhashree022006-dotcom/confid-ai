import pg from "pg";
import dotenv from "dotenv";
import dns from "dns";
import net from "net";
dotenv.config();

// Fixes a real Docker/WSL2 networking issue: Node's "Happy Eyeballs" algorithm
// tries both IPv4 and IPv6 addresses for outbound connections, and in this
// container's network, the IPv6 attempts fail with ENETUNREACH while the
// IPv4 attempts separately time out due to how the dual attempts interact -
// even though a plain single IPv4 connection works instantly. Disabling
// autoSelectFamily forces a single, direct IPv4 connection, matching what
// we already confirmed works.
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
  console.log("Database ready: sessions table exists");
}