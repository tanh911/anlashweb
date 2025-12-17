import express from "express";
import appointmentRoutes from "./appointmentRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import authRoutes from "./authRoutes.js";
import service from "./servicesRoutes.js";
import contentRoutes from "./contentRoutes.js";
import courseRoutes from "./courseRoutes.js";
import staffRoutes from "./staffRoutes.js";
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
router.use("/services", service);
router.use("/auth", authRoutes);
router.use("/content", contentRoutes);
router.use("/courses", courseRoutes);
router.use("/staff", staffRoutes);
export default router;
