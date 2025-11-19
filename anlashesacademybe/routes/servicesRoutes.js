import express from "express";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

const router = express.Router();

// Routes
router.get("/", getAllServices); // GET /api/services
router.post("/", createService); // POST /api/services
router.put("/:id", updateService); // PUT /api/services/:id
router.delete("/:id", deleteService); // DELETE /api/services/:id

export default router;
