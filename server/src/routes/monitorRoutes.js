import { Router } from "express";
import {
  listMonitors,
  getMonitor,
  createMonitor,
  updateMonitor,
  deleteMonitor,
} from "../controllers/monitorController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All monitor routes require authentication
router.use(protect);

router.get("/", listMonitors);
router.get("/:id", getMonitor);
router.post("/", createMonitor);
router.patch("/:id", updateMonitor);
router.delete("/:id", deleteMonitor);

export default router;
