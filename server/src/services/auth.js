import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { HttpError } from "../utils/errors.js";

// the two accounts behind the demo buttons
export const DEMO_EMAILS = {
  aarav: "aarav@realtimecards.app",
  diya: "diya@realtimecards.app",
};

export function createToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// checks a login token and returns its user, used by REST and by sockets
export async function userFromToken(token) {
  if (!token) {
    throw new HttpError(401, "Please log in");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Your session has expired, please log in again");
  }

  const result = await pool.query(
    "SELECT id, name, email, is_demo FROM users WHERE id = $1",
    [payload.userId],
  );
  if (result.rows.length === 0) {
    throw new HttpError(401, "Please log in");
  }
  return result.rows[0];
}
