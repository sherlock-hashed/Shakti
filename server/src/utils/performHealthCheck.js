import axios from "axios";
import CheckLog from "../models/CheckLog.js";
import Monitor from "../models/Monitor.js";

// Production-grade defaults
const REQUEST_TIMEOUT_MS = 10_000; // 10 second timeout
const MAX_REDIRECTS = 5;

/**
 * Perform a health check on a single monitor.
 *
 * 1. Sends an HTTP GET to the monitor's URL with a timeout.
 * 2. Measures response time using high-resolution timer.
 * 3. Compares the received status code to the monitor's expectedStatusCode.
 * 4. Saves a CheckLog document.
 * 5. Updates the Monitor's status, lastCheckedAt, and uptimePercent24h.
 *
 * This function NEVER throws — all errors are caught and recorded as a failed check.
 *
 * @param {Object} monitor - A Mongoose Monitor document (plain object or document).
 * @returns {{ isUp: boolean, statusCode: number|null, responseTimeMs: number }}
 */
export async function performHealthCheck(monitor) {
  const startTime = performance.now();
  let statusCode = null;
  let isUp = false;
  let responseTimeMs = 0;
  let errorMessage = null;

  try {
    // ─── Make the HTTP request ───
    const response = await axios.get(monitor.url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      validateStatus: () => true, // Accept ALL status codes (don't throw on 4xx/5xx)
      headers: {
        "User-Agent": "Pulseboard-HealthChecker/1.0",
        Accept: "*/*",
      },
      // Don't download large response bodies
      maxContentLength: 1024 * 1024, // 1 MB
      responseType: "text",
    });

    responseTimeMs = Math.round(performance.now() - startTime);
    statusCode = response.status;
    isUp = statusCode === monitor.expectedStatusCode;
  } catch (error) {
    responseTimeMs = Math.round(performance.now() - startTime);
    isUp = false;

    // ─── Categorize the failure ───
    if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
      errorMessage = "TIMEOUT";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "DNS_FAILURE";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "CONNECTION_REFUSED";
    } else if (error.code === "ECONNRESET") {
      errorMessage = "CONNECTION_RESET";
    } else if (error.code === "ERR_TLS_CERT_ALTNAME_INVALID" || error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      errorMessage = "SSL_ERROR";
    } else {
      errorMessage = error.code || error.message || "UNKNOWN_ERROR";
    }
  }

  try {
    // ─── Save CheckLog ───
    await CheckLog.create({
      monitor: monitor._id,
      statusCode,
      responseTimeMs,
      isUp,
      checkedAt: new Date(),
      errorMessage,
    });

    // ─── Calculate 24h uptime percentage ───
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentChecks = await CheckLog.find({
      monitor: monitor._id,
      checkedAt: { $gte: twentyFourHoursAgo },
    })
      .select("isUp")
      .lean();

    let uptimePercent24h = null;
    if (recentChecks.length > 0) {
      const upCount = recentChecks.filter((c) => c.isUp).length;
      uptimePercent24h = parseFloat(
        ((upCount / recentChecks.length) * 100).toFixed(2)
      );
    }

    // ─── Update monitor status ───
    await Monitor.findByIdAndUpdate(monitor._id, {
      status: isUp ? "up" : "down",
      lastCheckedAt: new Date(),
      uptimePercent24h,
    });
  } catch (dbError) {
    // Log but never crash the scheduler
    console.error(
      `[HealthChecker] DB error for monitor "${monitor.name}" (${monitor._id}):`,
      dbError.message
    );
  }

  return { isUp, statusCode, responseTimeMs, errorMessage };
}
