import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import nock from "nock";
import mongoose from "mongoose";
import { setupTestDB, clearTestDB, teardownTestDB } from "./setup.js";
import { performHealthCheck } from "../src/utils/performHealthCheck.js";
import CheckLog from "../src/models/CheckLog.js";
import Monitor from "../src/models/Monitor.js";
import User from "../src/models/User.js";

beforeAll(async () => await setupTestDB());
afterEach(async () => {
  nock.cleanAll();
  await clearTestDB();
});
afterAll(async () => await teardownTestDB());

/**
 * Helper: create a user + monitor in the DB for health check testing.
 */
async function createMonitorDoc(overrides = {}) {
  const user = await User.create({
    name: "HC User",
    email: `hc-${Date.now()}@test.com`,
    password: "password123",
  });

  const monitor = await Monitor.create({
    user: user._id,
    name: overrides.name || "HC Monitor",
    url: overrides.url || "https://mock-target.test/health",
    expectedStatusCode: overrides.expectedStatusCode || 200,
    intervalMinutes: 1,
    latencyThresholdMs: 800,
    downtimeThresholdMinutes: 5,
  });

  return monitor;
}

describe("performHealthCheck", () => {
  it("should record isUp: true when endpoint returns expected status code", async () => {
    const monitor = await createMonitorDoc();

    // Mock the target URL to return 200
    nock("https://mock-target.test")
      .get("/health")
      .reply(200, { status: "ok" });

    const result = await performHealthCheck(monitor);

    expect(result.isUp).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.errorMessage).toBeNull();

    // Verify CheckLog was saved
    const logs = await CheckLog.find({ monitor: monitor._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].isUp).toBe(true);
    expect(logs[0].statusCode).toBe(200);

    // Verify Monitor was updated
    const updated = await Monitor.findById(monitor._id);
    expect(updated.status).toBe("up");
    expect(updated.lastCheckedAt).not.toBeNull();
  });

  it("should record isUp: false when endpoint returns unexpected status code", async () => {
    const monitor = await createMonitorDoc({ expectedStatusCode: 200 });

    nock("https://mock-target.test")
      .get("/health")
      .reply(500, "Internal Server Error");

    const result = await performHealthCheck(monitor);

    expect(result.isUp).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.errorMessage).toBeNull(); // No network error, just wrong code

    const updated = await Monitor.findById(monitor._id);
    expect(updated.status).toBe("down");
  });

  it("should record isUp: false on network timeout without crashing", async () => {
    const monitor = await createMonitorDoc();

    // Simulate a connection timeout
    nock("https://mock-target.test")
      .get("/health")
      .delayConnection(15_000) // longer than the 10s timeout
      .reply(200);

    const result = await performHealthCheck(monitor);

    expect(result.isUp).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.errorMessage).toBeTruthy(); // "TIMEOUT" or similar

    // Verify it didn't crash — CheckLog should still be saved
    const logs = await CheckLog.find({ monitor: monitor._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].isUp).toBe(false);
  });

  it("should record isUp: false on DNS failure without crashing", async () => {
    const monitor = await createMonitorDoc({
      url: "https://this-domain-definitely-does-not-exist-xyz.test/health",
    });

    // nock won't intercept unknown hosts — the real DNS lookup will fail
    // which is exactly what we want to test
    const result = await performHealthCheck(monitor);

    expect(result.isUp).toBe(false);
    expect(result.errorMessage).toBeTruthy();

    const logs = await CheckLog.find({ monitor: monitor._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].isUp).toBe(false);
  });
});
