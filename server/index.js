import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { pool, initDb } from "./db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, system } = req.body;
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_tokens: 300,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/api/sessions", async (req, res) => {
  try {
    const { userId, mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability } = req.body;
    const result = await pool.query(
      `INSERT INTO sessions (user_id, mode, topic_or_role, overall_score, confidence, eye_contact, gesture, communication, hire_probability)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Session save failed:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

app.get("/api/sessions/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Session fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`confid.ai server running on http://localhost:${PORT}`));

initDb().catch((err) => {
  console.error("=== DATABASE CONNECTION ERROR ===");
  console.error("Message:", err.message);
  console.error("Code:", err.code);
  console.error("Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
  console.error("==================================");
});