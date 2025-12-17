// staffRoutes.js
import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  searchStaff,
  getAvailableStaff,
  getStaffByService,
  getStaffHealth,
} from "../controllers/staffController.js";

const router = express.Router();

// Public routes - không cần auth (cho frontend customer)
router.get("/health", getStaffHealth);
router.get("/available", getAvailableStaff);
router.get("/service/:serviceType", getStaffByService);

// Admin routes - có thể thêm middleware auth sau
router.get("/", getAllStaff);
router.get("/search", searchStaff);
router.get("/:id", getStaffById);
router.post("/create", createStaff);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
