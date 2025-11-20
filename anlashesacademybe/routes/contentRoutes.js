// routes/content.js
import express from "express";
import multer from "multer";
import {
  getHomeContent,
  updateHomeContent,
  getContentByPage,
  updateContentByPage,
  deleteContent,
  // Blog posts routes
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPublishedPosts,
  uploadPostImage, // THÊM
} from "../controllers/contentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình Multer cho upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh!"), false);
    }
  },
});

// Existing routes
router.get("/home", getHomeContent);
router.put("/home", protect, updateHomeContent);
router.get("/:page", getContentByPage);
router.put("/:page", protect, updateContentByPage);
router.delete("/:page", protect, deleteContent);

// Blog posts routes
router.post("/posts", protect, createPost);
router.post("/posts/upload", protect, upload.single("image"), uploadPostImage); // THÊM
router.get("/posts", getAllPosts);
router.get("/posts/published", getPublishedPosts);
router.get("/posts/:postId", getPostById);
router.put("/posts/:postId", protect, updatePost);
router.delete("/posts/:postId", protect, deletePost);

export default router;
