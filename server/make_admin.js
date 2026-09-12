import { pool } from "./db.js";

async function makeAdmin() {
  const userId = "subhashree022006@gmail.com";
  await pool.query("UPDATE users SET is_admin = TRUE WHERE user_id = $1", [userId]);
  console.log(`${userId} is now an admin.`);
  process.exit();
}

makeAdmin();
