import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDB, clearTestDB, teardownTestDB, createTestUser } from "./setup.js";

beforeAll(async () => await setupTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await teardownTestDB());

describe("POST /api/auth/register", () => {
  it("should register a new user and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "password123" })
      .expect(201);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      name: "Alice",
      email: "alice@test.com",
    });
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("should reject duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "dup@test.com", password: "password123" })
      .expect(201);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bob", email: "dup@test.com", password: "password456" })
      .expect(409);

    expect(res.body.message).toMatch(/already exists/i);
  });

  it("should reject missing fields", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice" })
      .expect(400);
  });
});

describe("POST /api/auth/login", () => {
  it("should login with correct credentials and return a token", async () => {
    // Register first
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "correctpass" })
      .expect(201);

    // Login
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "correctpass" })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("alice@test.com");
  });

  it("should reject wrong password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "correctpass" })
      .expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "wrongpass" })
      .expect(401);

    expect(res.body.message).toMatch(/invalid/i);
  });

  it("should reject non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" })
      .expect(401);

    expect(res.body.message).toMatch(/invalid/i);
  });
});

describe("GET /api/auth/me", () => {
  it("should return user profile with valid token", async () => {
    const { token } = await createTestUser(request, app);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("name");
    expect(res.body.user).toHaveProperty("email");
  });

  it("should reject request without token (401)", async () => {
    await request(app)
      .get("/api/auth/me")
      .expect(401);
  });

  it("should reject request with invalid token (401)", async () => {
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-garbage-token")
      .expect(401);
  });
});
