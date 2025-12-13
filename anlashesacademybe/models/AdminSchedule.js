// models/AdminSchedule.js
import mongoose from "mongoose";

const adminScheduleSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: false, // KHÔNG dùng unique: true
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    available_slots: {
      type: [String],
      default: [],
      validate: {
        validator: function (slots) {
          return slots.every((slot) => /^\d{2}:\d{2}$/.test(slot));
        },
        message: "Time slots must be in HH:MM format",
      },
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    custom_slots: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    autoIndex: false, // QUAN TRỌNG
  }
);

// 🚨 CHỈ định nghĩa index
adminScheduleSchema.index(
  { date: 1 },
  {
    unique: true,
    name: "schedule_date_unique",
  }
);

adminScheduleSchema.index(
  { is_available: 1, date: 1 },
  { name: "available_date_compound" }
);

adminScheduleSchema.index(
  { custom_slots: 1, date: 1 },
  { name: "custom_date_compound" }
);

// Virtual field
adminScheduleSchema.virtual("day_of_week").get(function () {
  const date = new Date(this.date);
  const days = [
    "Chủ Nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  return days[date.getDay()];
});

const AdminSchedule = mongoose.model("AdminSchedule", adminScheduleSchema);

export default AdminSchedule;
