import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// --------------- Middleware ---------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// --------------- Health Check ---------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
// Monitor routes will be mounted here in Phase 4

// --------------- Global Error Handler ---------------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
