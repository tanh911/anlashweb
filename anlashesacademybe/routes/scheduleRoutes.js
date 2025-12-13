// routes/scheduleRoutes.js
import express from "express";
import {
  initDefaultSchedules,
  getMonthlySlots,
  getDailySlots,
  getSchedules,
  createUpdateSchedule,
  deleteSchedule,
  resetSchedule,
  batchUpdateSchedules,
  getHealth,
  updateTimeSlots,
} from "../controllers/scheduleController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { get } from "mongoose";

const router = express.Router();

// Public routes
router.get("/health", getHealth);
router.get("/available/date/:date", getDailySlots);
router.get("/available/:year/:month", getMonthlySlots);

// Protected Admin routes
router.post("/init", initDefaultSchedules);
router.get("/", getSchedules);
router.post("/", createUpdateSchedule);
router.delete("/:date", deleteSchedule);
router.post("/reset/:date", resetSchedule);
router.post("/batch", batchUpdateSchedules);
router.post("/settings/time-slots", updateTimeSlots);
export default router;
