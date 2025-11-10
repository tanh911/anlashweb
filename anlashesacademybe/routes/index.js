import express from "express";
import appointmentRoutes from "./appointmentRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import authRoutes from "./authRoutes.js";
const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Appointment API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use("/appointments", appointmentRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/auth", authRoutes);

export default router;
