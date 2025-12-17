// routes/appointmentRoutes.js
import express from "express";
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
  cancelAppointment,
  checkAvailability,
  getAvailableStaff,
  checkStaffAvailability,
  getSlotDetails,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.get("/", getAppointments);
router.get("/availability/:date", checkAvailability);
router.get("/available-staff", getAvailableStaff); // Lấy danh sách nhân viên TRỐNG
router.get("/check-staff", checkStaffAvailability); // Kiểm tra nhân viên cụ thể
router.get("/:id", getAppointment);
router.post("/", createAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);
router.put("/:id/confirm", confirmAppointment);
router.put("/:id/cancel", cancelAppointment);
router.get("/slot-details", getSlotDetails); // Kiểm tra chi tiết khung giờ
export default router;
