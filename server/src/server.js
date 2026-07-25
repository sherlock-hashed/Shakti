import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startHealthCheckScheduler } from "./cron/healthChecker.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Start the health-check cron (only after DB is connected)
  startHealthCheckScheduler();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
};

start();
