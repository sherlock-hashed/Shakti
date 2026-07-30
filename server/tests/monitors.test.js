import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDB, clearTestDB, teardownTestDB, createTestUser } from "./setup.js";

beforeAll(async () => await setupTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await teardownTestDB());

describe("Monitor CRUD — unauthenticated", () => {
  it("GET /api/monitors without JWT → 401", async () => {
    await request(app).get("/api/monitors").expect(401);
  });

  it("POST /api/monitors without JWT → 401", async () => {
    await request(app)
      .post("/api/monitors")
      .send({ name: "Test", url: "https://example.com" })
      .expect(401);
  });
});

describe("Monitor CRUD — authenticated", () => {
  let tokenA, tokenB;

  afterEach(async () => await clearTestDB());

  async function setupUsers() {
    const userA = await createTestUser(request, app, {
      name: "User A",
      email: "a@test.com",
    });
    const userB = await createTestUser(request, app, {
      name: "User B",
      email: "b@test.com",
    });
    tokenA = userA.token;
    tokenB = userB.token;
  }

  it("should create a monitor", async () => {
    await setupUsers();

    const res = await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "My API",
        url: "https://api.example.com/health",
        expectedStatusCode: 200,
        intervalMinutes: 5,
        isActive: true,
        latencyThresholdMs: 800,
        downtimeThresholdMinutes: 5,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      name: "My API",
      url: "https://api.example.com/health",
      status: "pending",
    });
    expect(res.body).toHaveProperty("id");
  });

  it("should list only the authenticated user's monitors", async () => {
    await setupUsers();

    // User A creates 2 monitors
    await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "A-Mon-1", url: "https://a1.example.com", expectedStatusCode: 200, intervalMinutes: 5, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "A-Mon-2", url: "https://a2.example.com", expectedStatusCode: 200, intervalMinutes: 5, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    // User B creates 1 monitor
    await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "B-Mon-1", url: "https://b1.example.com", expectedStatusCode: 200, intervalMinutes: 5, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    // User A should see exactly 2
    const resA = await request(app)
      .get("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(resA.body).toHaveLength(2);
    expect(resA.body.every((m) => m.name.startsWith("A-"))).toBe(true);

    // User B should see exactly 1
    const resB = await request(app)
      .get("/api/monitors")
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(200);

    expect(resB.body).toHaveLength(1);
    expect(resB.body[0].name).toBe("B-Mon-1");
  });

  it("should get a single monitor by ID", async () => {
    await setupUsers();

    const created = await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Detail Mon", url: "https://detail.example.com", expectedStatusCode: 200, intervalMinutes: 1, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    const res = await request(app)
      .get(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.name).toBe("Detail Mon");
    expect(res.body).toHaveProperty("checks");
    expect(Array.isArray(res.body.checks)).toBe(true);
  });

  it("should update a monitor with PATCH", async () => {
    await setupUsers();

    const created = await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Old Name", url: "https://old.example.com", expectedStatusCode: 200, intervalMinutes: 5, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    const res = await request(app)
      .patch(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "New Name" })
      .expect(200);

    expect(res.body.name).toBe("New Name");
    expect(res.body.url).toBe("https://old.example.com"); // unchanged
  });

  it("should delete a monitor", async () => {
    await setupUsers();

    const created = await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "To Delete", url: "https://del.example.com", expectedStatusCode: 200, intervalMinutes: 5, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    await request(app)
      .delete(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    // Verify it's gone
    await request(app)
      .get(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(404);
  });

  it("cross-user isolation: User B cannot access User A's monitor", async () => {
    await setupUsers();

    const created = await request(app)
      .post("/api/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "A-Private", url: "https://private.example.com", expectedStatusCode: 200, intervalMinutes: 5, latencyThresholdMs: 800, downtimeThresholdMinutes: 5 })
      .expect(201);

    // User B tries to GET User A's monitor → 404
    await request(app)
      .get(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    // User B tries to PATCH User A's monitor → 404
    await request(app)
      .patch(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Hacked" })
      .expect(404);

    // User B tries to DELETE User A's monitor → 404
    await request(app)
      .delete(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    // Confirm it still exists for User A
    const res = await request(app)
      .get(`/api/monitors/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.name).toBe("A-Private");
  });
});
