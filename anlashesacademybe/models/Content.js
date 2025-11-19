// models/Content.js
import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      unique: true,
      enum: ["home", "about", "contact", "services", "blog"],
    },
    features: [
      {
        icon: String,
        title: String,
        description: String,
      },
    ],
    cta: {
      title: String,
      description: String,
      buttonText: String,
    },
    stats: [
      {
        number: String,
        label: String,
      },
    ],
    // Thêm trường cho blog posts
    posts: [
      {
        title: String,
        content: String,
        author: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        tags: [String],
        isPublished: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Content", contentSchema);
