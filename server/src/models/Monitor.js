import mongoose from "mongoose";

const monitorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Monitor name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid HTTP/HTTPS URL"],
    },
    expectedStatusCode: {
      type: Number,
      required: true,
      default: 200,
      min: [100, "Status code must be between 100 and 599"],
      max: [599, "Status code must be between 100 and 599"],
    },
    intervalMinutes: {
      type: Number,
      required: true,
      default: 5,
      enum: {
        values: [1, 5, 15, 30],
        message: "Interval must be 1, 5, 15, or 30 minutes",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["up", "down", "pending"],
      default: "pending",
    },
    uptimePercent24h: {
      type: Number,
      default: null,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    latencyThresholdMs: {
      type: Number,
      required: true,
      default: 800,
      min: [50, "Latency threshold must be at least 50ms"],
      max: [60000, "Latency threshold cannot exceed 60000ms"],
    },
    downtimeThresholdMinutes: {
      type: Number,
      required: true,
      default: 5,
      min: [1, "Downtime threshold must be at least 1 minute"],
      max: [1440, "Downtime threshold cannot exceed 1440 minutes"],
    },
  },
  { timestamps: true }
);

// Compound index: user + name should be unique (a user can't have two monitors with the same name)
monitorSchema.index({ user: 1, name: 1 }, { unique: true });

const Monitor = mongoose.model("Monitor", monitorSchema);

export default Monitor;
