// models/Post.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      minlength: [1, "Tiêu đề không được để trống"],
    },
    content: {
      type: String,
      required: [true, "Nội dung là bắt buộc"],
      minlength: [1, "Nội dung không được để trống"],
    },
    author: {
      type: String,
      required: true,
      default: "Admin",
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published"],
        message: "Trạng thái phải là draft hoặc published",
      },
      default: "draft",
    },
    featuredImage: {
      type: String, // URL ảnh đại diện
      default: "",
    },
    images: [
      {
        type: String, // URLs của các ảnh trong bài viết
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Post", postSchema);
