import express from "express";
import {
  getMonthlySlots,
  getDailySlots,
  getSchedules,
  createUpdateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";
import { validateSchedule } from "../middleware/validation.js";
console.log("✅ Schedule routes mounted");

const router = express.Router();

router.get("/available/date/:date", getDailySlots);
router.get("/available/:year/:month", getMonthlySlots);
// router.get(
//   "/available/:year/:month",
//   (req, res, next) => {
//     console.log("🔥 Called: /available/:year/:month");
//     next();
//   },
//   getMonthlySlots
// );

// router.get(
//   "/available/date/:date",
//   (req, res, next) => {
//     console.log("🔥 Called: /available/date/:date");
//     next();
//   },
//   getDailySlots
// );
router
  .route("/")
  .get(getSchedules)
  .post(validateSchedule, createUpdateSchedule);

router.delete("/:date", deleteSchedule);

export default router;
