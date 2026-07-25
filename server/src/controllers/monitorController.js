import Monitor from "../models/Monitor.js";

/**
 * Format a monitor document to match the frontend's expected shape:
 * { id, name, url, expectedStatusCode, intervalMinutes, isActive, status,
 *   uptimePercent24h, lastCheckedAt, latencyThresholdMs, downtimeThresholdMinutes }
 */
function formatMonitor(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    url: doc.url,
    expectedStatusCode: doc.expectedStatusCode,
    intervalMinutes: doc.intervalMinutes,
    isActive: doc.isActive,
    status: doc.status,
    uptimePercent24h: doc.uptimePercent24h,
    lastCheckedAt: doc.lastCheckedAt ? doc.lastCheckedAt.toISOString() : null,
    latencyThresholdMs: doc.latencyThresholdMs,
    downtimeThresholdMinutes: doc.downtimeThresholdMinutes,
  };
}

/**
 * Format a check subdocument to match the frontend's Check interface:
 * { id, statusCode, responseTimeMs, isUp, checkedAt }
 */
function formatCheck(check) {
  return {
    id: check._id.toString(),
    statusCode: check.statusCode,
    responseTimeMs: check.responseTimeMs,
    isUp: check.isUp,
    checkedAt: check.checkedAt.toISOString(),
  };
}

// ─────────────────── GET /api/monitors ───────────────────
export async function listMonitors(req, res, next) {
  try {
    // Fetch all monitors for the authenticated user (without the checks array for list view)
    const docs = await Monitor.find({ user: req.user._id })
      .select("-checks")
      .sort({ createdAt: -1 })
      .lean();

    const monitors = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      url: doc.url,
      expectedStatusCode: doc.expectedStatusCode,
      intervalMinutes: doc.intervalMinutes,
      isActive: doc.isActive,
      status: doc.status,
      uptimePercent24h: doc.uptimePercent24h,
      lastCheckedAt: doc.lastCheckedAt ? doc.lastCheckedAt.toISOString() : null,
      latencyThresholdMs: doc.latencyThresholdMs,
      downtimeThresholdMinutes: doc.downtimeThresholdMinutes,
    }));

    res.json(monitors);
  } catch (error) {
    next(error);
  }
}

// ─────────────────── GET /api/monitors/:id ───────────────────
export async function getMonitor(req, res, next) {
  try {
    const doc = await Monitor.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Monitor not found" });
    }

    res.json({
      ...formatMonitor(doc),
      checks: doc.checks.map(formatCheck),
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Monitor not found" });
    }
    next(error);
  }
}

// ─────────────────── POST /api/monitors ───────────────────
export async function createMonitor(req, res, next) {
  try {
    const {
      name,
      url,
      expectedStatusCode,
      intervalMinutes,
      isActive,
      latencyThresholdMs,
      downtimeThresholdMinutes,
    } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: "Name and URL are required" });
    }

    const doc = await Monitor.create({
      user: req.user._id,
      name,
      url,
      expectedStatusCode,
      intervalMinutes,
      isActive,
      latencyThresholdMs,
      downtimeThresholdMinutes,
    });

    res.status(201).json(formatMonitor(doc));
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    // Duplicate key error (same user + same monitor name)
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "You already have a monitor with this name" });
    }
    next(error);
  }
}

// ─────────────────── PATCH /api/monitors/:id ───────────────────
export async function updateMonitor(req, res, next) {
  try {
    // Only allow updating specific fields (not user, status, checks, etc.)
    const allowedFields = [
      "name",
      "url",
      "expectedStatusCode",
      "intervalMinutes",
      "isActive",
      "latencyThresholdMs",
      "downtimeThresholdMinutes",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const doc = await Monitor.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).select("-checks");

    if (!doc) {
      return res.status(404).json({ message: "Monitor not found" });
    }

    res.json(formatMonitor(doc));
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Monitor not found" });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "You already have a monitor with this name" });
    }
    next(error);
  }
}

// ─────────────────── DELETE /api/monitors/:id ───────────────────
export async function deleteMonitor(req, res, next) {
  try {
    const doc = await Monitor.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Monitor not found" });
    }

    res.json({ success: true });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Monitor not found" });
    }
    next(error);
  }
}
