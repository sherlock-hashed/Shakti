import cron from "node-cron";
import Monitor from "../models/Monitor.js";
import { performHealthCheck } from "../utils/performHealthCheck.js";

// Maximum concurrent health checks to prevent overwhelming the server / network
const CONCURRENCY_LIMIT = 10;

/**
 * Process an array of monitors with concurrency control.
 * Executes up to CONCURRENCY_LIMIT checks in parallel.
 */
async function processWithConcurrency(monitors) {
  const results = [];
  const executing = new Set();

  for (const monitor of monitors) {
    const promise = performHealthCheck(monitor).then((result) => {
      executing.delete(promise);
      return { monitor: monitor.name, ...result };
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
 * Start the health-check cron scheduler.
 *
 * Runs every minute. On each tick:
 * 1. Finds all active monitors whose lastCheckedAt is older than their intervalMinutes
 *    (or has never been checked).
 * 2. Executes health checks with concurrency control.
 * 3. Logs a summary.
 *
 * @returns {import("node-cron").ScheduledTask} The cron task (can be stopped with .stop())
 */
export function startHealthCheckScheduler() {
  console.log("⏱️  Health-check scheduler started (runs every minute)");

  const task = cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find all active monitors that are due for a check:
      // - Never checked (lastCheckedAt is null)
      // - OR lastCheckedAt + intervalMinutes <= now
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
      }).lean();

      if (monitors.length === 0) return;

      console.log(
        `[HealthChecker] ${now.toISOString()} — Checking ${monitors.length} monitor(s)...`
      );

      const results = await processWithConcurrency(monitors);

      // Summary log
      const upCount = results.filter((r) => r.isUp).length;
      const downCount = results.length - upCount;
      console.log(
        `[HealthChecker] Done — ${upCount} up, ${downCount} down`
      );

      // Log failures for debugging
      results
        .filter((r) => !r.isUp)
        .forEach((r) => {
          console.log(
            `  ⚠️  ${r.monitor}: ${r.errorMessage || `HTTP ${r.statusCode}`} (${r.responseTimeMs}ms)`
          );
        });
    } catch (error) {
      // Cron must never crash
      console.error("[HealthChecker] Scheduler error:", error.message);
    }
  });

  return task;
}
