import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  authPhone,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", protect, getAdminProfile); // protect this route
router.post("/logout", logoutAdmin);
router.post("/booking", authPhone);
export default router;
