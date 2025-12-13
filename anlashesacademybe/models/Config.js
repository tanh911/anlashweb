// models/Config.js
import mongoose from "mongoose";

const configSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: false, // KHÔNG dùng unique: true
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    autoIndex: false, // QUAN TRỌNG
  }
);

// 🚨 CHỈ định nghĩa index, KHÔNG tự động tạo
configSchema.index(
  { key: 1 },
  {
    unique: true,
    name: "config_key_unique",
  }
);

const Config = mongoose.model("Config", configSchema);

export default Config;
