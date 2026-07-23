import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Format user document into the shape the frontend expects:
 * { id, name, email }
 */
function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

// ─────────────────── POST /api/auth/register ───────────────────
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Create user (password is hashed by the pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    next(error);
  }
}

// ─────────────────── POST /api/auth/login ───────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and explicitly include the password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────── GET /api/auth/me ───────────────────
export async function getMe(req, res) {
  // req.user is attached by the protect middleware
  res.json({ user: formatUser(req.user) });
}
