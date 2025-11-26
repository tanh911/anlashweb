import mongoose from "mongoose";

// Category Schema lồng trong Course Schema

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề khóa học là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },
    description: {
      type: String,
      required: [true, "Mô tả khóa học là bắt buộc"],
    },
    price: {
      type: Number,
      required: [true, "Giá khóa học là bắt buộc"],
      min: [0, "Giá không được âm"],
    },
    duration: {
      type: String,
      required: [true, "Thời lượng khóa học là bắt buộc"],
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // Category trở thành SUB-SCHEMA
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Course", courseSchema);
