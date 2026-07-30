import { describe, it, expect, jest, beforeAll, afterAll, afterEach } from "@jest/globals";
import nock from "nock";
import { setupTestDB, clearTestDB, teardownTestDB } from "./setup.js";
import { performHealthCheck } from "../src/utils/performHealthCheck.js";
import * as alertModule from "../src/utils/sendAlertEmail.js";
import Monitor from "../src/models/Monitor.js";
import User from "../src/models/User.js";

beforeAll(async () => await setupTestDB());
afterEach(async () => {
  nock.cleanAll();
  await clearTestDB();
});
afterAll(async () => await teardownTestDB());

/**
 * Helper: create a user + monitor in the DB.
 */
async function createMonitorDoc(overrides = {}) {
  const user = await User.create({
    name: "Alert User",
    email: `alert-${Date.now()}@test.com`,
    password: "password123",
  });

  const monitor = await Monitor.create({
    user: user._id,
    name: overrides.name || "Alert Monitor",
    url: overrides.url || "https://alert-target.test/health",
    expectedStatusCode: 200,
    intervalMinutes: 1,
    status: overrides.status || "pending",
    latencyThresholdMs: 800,
    downtimeThresholdMinutes: 5,
  });

  // Populate user for the scheduler's checkAndAlert logic
  return await Monitor.findById(monitor._id).populate("user", "name email");
}

/**
 * Simulate the checkAndAlert logic from scheduler.js.
 * This replicates the state-flip detection logic for isolated testing.
 */
async function checkAndAlert(monitor, sendAlertEmailSpy) {
  const previousStatus = monitor.status;
  const previousIsUp = previousStatus === "up";

  const result = await performHealthCheck(monitor);
  const newIsUp = result.isUp;

  let stateFlipped = false;
  let newAlertStatus = null;

  if (previousStatus === "pending") {
    if (!newIsUp) {
      stateFlipped = true;
      newAlertStatus = "DOWN";
    }
  } else if (previousIsUp !== newIsUp) {
    stateFlipped = true;
    newAlertStatus = newIsUp ? "RECOVERED" : "DOWN";
  }

  if (stateFlipped && newAlertStatus && monitor.user && monitor.user.email) {
    await sendAlertEmailSpy({
      userEmail: monitor.user.email,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      status: newAlertStatus,
      checkedAt: new Date(),
      errorMessage: result.errorMessage,
      statusCode: result.statusCode,
    });
  }

  return { ...result, stateFlipped, alertStatus: newAlertStatus };
}

describe("Alert state-flip detection", () => {
  let sendAlertEmailSpy;

  beforeEach(() => {
    sendAlertEmailSpy = jest.fn(() => Promise.resolve(true));
  });

  it("pending → down: should call alert once (DOWN)", async () => {
    const monitor = await createMonitorDoc({ status: "pending" });

    // Mock endpoint returning 500 (down)
    nock("https://alert-target.test").get("/health").reply(500);

    const result = await checkAndAlert(monitor, sendAlertEmailSpy);

    expect(result.isUp).toBe(false);
    expect(result.stateFlipped).toBe(true);
    expect(result.alertStatus).toBe("DOWN");
    expect(sendAlertEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendAlertEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "DOWN" })
    );
  });

  it("pending → up: should NOT call alert", async () => {
    const monitor = await createMonitorDoc({ status: "pending" });

    nock("https://alert-target.test").get("/health").reply(200, "OK");

    const result = await checkAndAlert(monitor, sendAlertEmailSpy);

    expect(result.isUp).toBe(true);
    expect(result.stateFlipped).toBe(false);
    expect(sendAlertEmailSpy).not.toHaveBeenCalled();
  });

  it("up → down: should call alert once (DOWN)", async () => {
    const monitor = await createMonitorDoc({ status: "up" });

    nock("https://alert-target.test").get("/health").reply(503);

    const result = await checkAndAlert(monitor, sendAlertEmailSpy);

    expect(result.isUp).toBe(false);
    expect(result.stateFlipped).toBe(true);
    expect(result.alertStatus).toBe("DOWN");
    expect(sendAlertEmailSpy).toHaveBeenCalledTimes(1);
  });

  it("sustained down → down: should NOT call alert again", async () => {
    const monitor = await createMonitorDoc({ status: "down" });

    nock("https://alert-target.test").get("/health").reply(500);

    const result = await checkAndAlert(monitor, sendAlertEmailSpy);

    expect(result.isUp).toBe(false);
    expect(result.stateFlipped).toBe(false);
    expect(sendAlertEmailSpy).not.toHaveBeenCalled();
  });

  it("down → up: should call alert once (RECOVERED)", async () => {
    const monitor = await createMonitorDoc({ status: "down" });

    nock("https://alert-target.test").get("/health").reply(200, "OK");

    const result = await checkAndAlert(monitor, sendAlertEmailSpy);

    expect(result.isUp).toBe(true);
    expect(result.stateFlipped).toBe(true);
    expect(result.alertStatus).toBe("RECOVERED");
    expect(sendAlertEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendAlertEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "RECOVERED" })
    );
  });

  it("sustained up → up: should NOT call alert", async () => {
    const monitor = await createMonitorDoc({ status: "up" });

    nock("https://alert-target.test").get("/health").reply(200, "OK");

    const result = await checkAndAlert(monitor, sendAlertEmailSpy);

    expect(result.isUp).toBe(true);
    expect(result.stateFlipped).toBe(false);
    expect(sendAlertEmailSpy).not.toHaveBeenCalled();
  });
});
