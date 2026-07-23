import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Middleware to protect routes — requires a valid Bearer token.
 * Attaches `req.user` (the full user document, minus password) on success.
 */
export async function protect(req, res, next) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized — no token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Not authorized — invalid or expired token" });
    }

    // 3. Fetch user (ensure they still exist)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized — user no longer exists" });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
