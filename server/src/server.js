import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startScheduler } from "./cron/scheduler.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Start the health-check cron scheduler (only after DB is connected)
  startScheduler();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
};

start();
