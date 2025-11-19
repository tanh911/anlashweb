// routes/content.js
import express from "express";
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
} from "../controllers/contentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Existing routes
router.get("/home", getHomeContent);
router.put("/home", protect, updateHomeContent);
router.get("/:page", getContentByPage);
router.put("/:page", protect, updateContentByPage);
router.delete("/:page", protect, deleteContent);

// Blog posts routes
router.post("/posts", protect, createPost);
router.get("/posts", getAllPosts);
router.get("/posts/published", getPublishedPosts);
router.get("/posts/:postId", getPostById);
router.put("/posts/:postId", protect, updatePost);
router.delete("/posts/:postId", protect, deletePost);

export default router;
