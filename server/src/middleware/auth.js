import { userFromToken } from "../services/auth.js";

// reads the token from the header and loads the user onto req.user
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  req.user = await userFromToken(token);
  next();
}
