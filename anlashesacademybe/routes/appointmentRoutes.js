import express from "express";
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
  cancelAppointment,
} from "../controllers/appointmentController.js";
import { validateAppointment } from "../middleware/validation.js";

const router = express.Router();

router
  .route("/")
  .get(getAppointments)
  .post(validateAppointment, createAppointment);

router
  .route("/:id")
  .get(getAppointment)
  .put(updateAppointment)
  .delete(deleteAppointment);

router.put("/:id/confirm", confirmAppointment);
router.put("/:id/cancel", cancelAppointment);

export default router;
