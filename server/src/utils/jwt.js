import jwt from "jsonwebtoken";

/**
 * Generate a signed JWT for the given user ID.
 * @param {string} userId - The MongoDB _id of the user.
 * @returns {string} Signed JWT string.
 */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

/**
 * Verify and decode a JWT.
 * @param {string} token - The JWT string.
 * @returns {{ id: string }} Decoded payload.
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
