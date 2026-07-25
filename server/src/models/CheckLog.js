import mongoose from "mongoose";

const checkLogSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      default: null, // null when network error / timeout (no HTTP response received)
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    isUp: {
      type: Boolean,
      required: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    errorMessage: {
      type: String,
      default: null, // Stores failure reason: "TIMEOUT", "ENOTFOUND", "ECONNREFUSED", etc.
    },
  },
  {
    timestamps: false, // checkedAt is our timestamp
    versionKey: false,
  }
);

// Compound index for efficient "get recent checks for a monitor" queries
checkLogSchema.index({ monitor: 1, checkedAt: -1 });

// TTL index: automatically delete logs older than 30 days to prevent unbounded growth
checkLogSchema.index(
  { checkedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days
);

const CheckLog = mongoose.model("CheckLog", checkLogSchema);

export default CheckLog;
