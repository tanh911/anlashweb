import express from "express";
const router = express.Router();

import { body } from "express-validator";
import {
  getCourses,
  getFeaturedCourses,
  getCoursesByCategory,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
} from "../controllers/courseController.js";

import { protect } from "../middleware/auth.js";

// Validation rules
const courseValidation = [
  body("title")
    .notEmpty()
    .withMessage("Tiêu đề khóa học là bắt buộc")
    .isLength({ max: 200 })
    .withMessage("Tiêu đề không được vượt quá 200 ký tự"),
  body("description")
    .notEmpty()
    .withMessage("Mô tả khóa học là bắt buộc")
    .isLength({ max: 1000 })
    .withMessage("Mô tả không được vượt quá 1000 ký tự"),
  body("price")
    .isNumeric()
    .withMessage("Giá khóa học phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá không được âm"),
  body("duration").notEmpty().withMessage("Thời lượng khóa học là bắt buộc"),
];

// Public routes
router.get("/get_courses", getCourses);
router.get("/featured", getFeaturedCourses);
router.get("/category/:category", getCoursesByCategory);
//router.get("/:id", getCourse);

// Protected admin routes
router.post("/create", protect, courseValidation, createCourse);
router.put("/update/:id", protect, courseValidation, updateCourse);
router.delete("/delete/:id", protect, deleteCourse);
router.patch("/:id/publish", protect, togglePublish);

export default router;
