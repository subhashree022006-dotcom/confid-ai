import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import crypto from "crypto";
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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const JWT_SECRET = process.env.JWT_SECRET;
const FREE_SESSION_LIMIT = 4;

const PLANS = {
  student: { amount: 29900, months: 6, label: "Student" },
  regular: { amount: 79900, months: 6, label: "Regular" },
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.post("/api/signup", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password || password.length < 4) {
      return res.status(400).json({ error: "Enter a user ID and a password of at least 4 characters." });
    }
    const existing = await pool.query("SELECT id FROM users WHERE user_id = $1", [userId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "That user ID is already taken." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (user_id, password_hash, plan) VALUES ($1, $2, 'free')",
      [userId, passwordHash]
    );
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, userId, plan: "free" });
  } catch (err) {
    console.error("Signup failed:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { userId, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid user ID or password." });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid user ID or password." });
    }
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, userId, plan: user.plan, planExpiresAt: user.plan_expires_at });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, plan, plan_expires_at FROM users WHERE user_id = $1", [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = result.rows[0];

    let plan = user.plan;
    if (plan !== "free" && user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
      await pool.query("UPDATE users SET plan = 'free', plan_expires_at = NULL WHERE user_id = $1", [req.userId]);
      plan = "free";
    }

    const sessionCountResult = await pool.query("SELECT COUNT(*) FROM sessions WHERE user_id = $1", [req.userId]);
    const sessionsUsed = parseInt(sessionCountResult.rows[0].count, 10);

    res.json({
      userId: user.user_id,
      plan,
      planExpiresAt: user.plan_expires_at,
      sessionsUsed,
      freeSessionLimit: FREE_SESSION_LIMIT,
      canPractice: plan !== "free" || sessionsUsed < FREE_SESSION_LIMIT,
    });
  } catch (err) {
    console.error("Fetch user failed:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/create-order", authMiddleware, async (req, res) => {
  try {
    const { planType } = req.body;
    const plan = PLANS[planType];
    if (!plan) return res.status(400).json({ error: "Invalid plan type" });

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: "INR",
      receipt: `receipt_${req.userId}_${Date.now()}`,
      notes: { userId: req.userId, planType },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planLabel: plan.label,
    });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post("/api/verify-payment", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;
    const plan = PLANS[planType];
    if (!plan) return res.status(400).json({ error: "Invalid plan type" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + plan.months);

    await pool.query(
      "UPDATE users SET plan = $1, plan_expires_at = $2 WHERE user_id = $3",
      [planType === "student" ? "student_pending" : "regular", expiresAt, req.userId]
    );

    res.json({ ok: true, plan: planType === "student" ? "student_pending" : "regular", planExpiresAt: expiresAt });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
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

app.post("/api/sessions", authMiddleware, async (req, res) => {
  try {
    const { mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability } = req.body;
    const userResult = await pool.query("SELECT plan FROM users WHERE user_id = $1", [req.userId]);
    const plan = userResult.rows[0]?.plan || "free";

    if (plan === "free") {
      const countResult = await pool.query("SELECT COUNT(*) FROM sessions WHERE user_id = $1", [req.userId]);
      const used = parseInt(countResult.rows[0].count, 10);
      if (used >= FREE_SESSION_LIMIT) {
        return res.status(403).json({ error: "Free session limit reached. Please upgrade to continue practicing." });
      }
    }

    const result = await pool.query(
      `INSERT INTO sessions (user_id, mode, topic_or_role, overall_score, confidence, eye_contact, gesture, communication, hire_probability)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Session save failed:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

app.get("/api/sessions/:userId", authMiddleware, async (req, res) => {
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
