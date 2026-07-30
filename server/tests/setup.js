/**
 * Shared test setup for all test suites.
 * Spins up an in-memory MongoDB instance, connects Mongoose,
 * and tears everything down after tests complete.
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

/**
 * Start an in-memory MongoDB and connect Mongoose to it.
 * Call this in beforeAll().
 */
export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set env vars needed by the app
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.CLIENT_URL = "http://localhost:5173";

  await mongoose.connect(uri);
}

/**
 * Drop all collections between tests to ensure isolation.
 * Call this in afterEach().
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnect Mongoose and stop the in-memory server.
 * Call this in afterAll().
 */
export async function teardownTestDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Register a test user and return { token, user }.
 * Convenience helper used across multiple test suites.
 */
export async function createTestUser(request, app, overrides = {}) {
  const payload = {
    name: overrides.name || "Test User",
    email: overrides.email || "test@example.com",
    password: overrides.password || "password123",
  };

  const res = await request(app)
    .post("/api/auth/register")
    .send(payload)
    .expect(201);

  return {
    token: res.body.token,
    user: res.body.user,
    password: payload.password,
    email: payload.email,
  };
}
