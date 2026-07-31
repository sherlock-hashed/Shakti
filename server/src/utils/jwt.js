import jwt from "jsonwebtoken";

/**
 * Generate a signed JWT for the given user ID.
 * @param {string} userId - The MongoDB _id of the user.
 * @returns {string} Signed JWT string.
 */
export function generateToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId.toString() }, secret, { expiresIn });
}

/**
 * Verify and decode a JWT.
 * @param {string} token - The JWT string.
 * @returns {{ id: string }} Decoded payload.
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }
  return jwt.verify(token, secret);
}
