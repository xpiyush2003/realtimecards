import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { demoSchema, loginSchema, registerSchema } from "../schemas/index.js";
import { createToken, DEMO_EMAILS } from "../services/auth.js";
import { HttpError } from "../utils/errors.js";

const router = Router();

const limitOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Too many tries, please wait a few minutes" },
};
const limiter = rateLimit(limitOptions);
// the demo buttons get their own count so failed logins do not block them
const demoLimiter = rateLimit({ ...limitOptions, limit: 40 });

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    is_demo: user.is_demo,
  };
}

router.post(
  "/register",
  limiter,
  validate(registerSchema),
  async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await pool.query("SELECT 1 FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      throw new HttpError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, is_demo`,
      [name, email, passwordHash],
    );
    const user = result.rows[0];
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  },
);

router.post("/login", limiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const user = result.rows[0];
  const matches = user && (await bcrypt.compare(password, user.password_hash));
  if (!matches) {
    throw new HttpError(401, "Wrong email or password");
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

// one-click login as one of the two seeded demo users
router.post("/demo", demoLimiter, validate(demoSchema), async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_demo",
    [DEMO_EMAILS[req.body.who]],
  );
  const user = result.rows[0];
  if (!user) {
    throw new HttpError(503, "The demo account has not been set up yet");
  }
  res.json({ token: createToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
