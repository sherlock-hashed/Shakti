import cron from "node-cron";
import Monitor from "../models/Monitor.js";
import { performHealthCheck } from "../utils/performHealthCheck.js";
import { sendAlertEmail } from "../utils/sendAlertEmail.js";

// Maximum concurrent health checks to prevent network / CPU bottlenecks
const CONCURRENCY_LIMIT = 10;

/**
 * Execute health check for a monitor and trigger email alerts on state change only.
 *
 * @param {Object} monitor - Mongoose monitor object (populated with user)
 */
async function checkAndAlert(monitor) {
  const previousStatus = monitor.status; // "up", "down", or "pending"
  const previousIsUp = previousStatus === "up";

  const result = await performHealthCheck(monitor);
  const newIsUp = result.isUp;

  // Determine if state changed
  let stateFlipped = false;
  let newAlertStatus = null;

  if (previousStatus === "pending") {
    // Initial check: alert if down
    if (!newIsUp) {
      stateFlipped = true;
      newAlertStatus = "DOWN";
    }
  } else if (previousIsUp !== newIsUp) {
    stateFlipped = true;
    newAlertStatus = newIsUp ? "RECOVERED" : "DOWN";
  }

  // Trigger email alert ONLY on state change
  if (stateFlipped && newAlertStatus && monitor.user && monitor.user.email) {
    console.log(
      `🔔 State change detected for "${monitor.name}" (${previousStatus} -> ${newIsUp ? "up" : "down"}). Sending ${newAlertStatus} alert email...`
    );

    // Fire and forget (or await) email sending so it doesn't block scheduler loop
    sendAlertEmail({
      userEmail: monitor.user.email,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      status: newAlertStatus,
      checkedAt: new Date(),
      errorMessage: result.errorMessage,
      statusCode: result.statusCode,
    }).catch((err) => {
      console.error(`❌ Email send error for "${monitor.name}":`, err.message);
    });
  }

  return { monitor: monitor.name, ...result, stateFlipped };
}

/**
 * Process due monitors with concurrency control.
 */
async function processWithConcurrency(monitors) {
  const results = [];
  const executing = new Set();

  for (const monitor of monitors) {
    const promise = checkAndAlert(monitor).then((res) => {
      executing.delete(promise);
      return res;
    });
    executing.add(promise);
    results.push(promise);

    if (executing.size >= CONCURRENCY_LIMIT) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * Start the node-cron health check scheduler.
 * Runs every minute to find active monitors due for a check.
 */
let isRunning = false;

export function startScheduler() {
  console.log("⏱️  Cron scheduler initialized (runs every 1 minute)");

  const task = cron.schedule("* * * * *", async () => {
    if (isRunning) {
      console.log("[CronScheduler] Sweep already in progress, skipping interval.");
      return;
    }

    isRunning = true;
    try {
      const now = new Date();

      // Find active monitors that are due for check:
      // - lastCheckedAt is null (never checked)
      // - OR lastCheckedAt + (intervalMinutes * 60 * 1000) <= now
      const monitors = await Monitor.find({
        isActive: true,
        $or: [
          { lastCheckedAt: null },
          {
            $expr: {
              $lte: [
                {
                  $add: [
                    "$lastCheckedAt",
                    { $multiply: ["$intervalMinutes", 60 * 1000] },
                  ],
                },
                now,
              ],
            },
          },
        ],
      }).populate("user", "name email");

      if (!monitors || monitors.length === 0) {
        return;
      }

      console.log(
        `[CronScheduler] ${now.toISOString()} — Checking ${monitors.length} due monitor(s)...`
      );

      const results = await processWithConcurrency(monitors);

      const upCount = results.filter((r) => r.isUp).length;
      const downCount = results.length - upCount;
      const alertsSent = results.filter((r) => r.stateFlipped).length;

      console.log(
        `[CronScheduler] Sweep complete — ${upCount} up, ${downCount} down (${alertsSent} alert(s) triggered)`
      );
    } catch (error) {
      console.error("[CronScheduler] Sweep error:", error.message);
    } finally {
      isRunning = false;
    }
  });

  return task;
}
