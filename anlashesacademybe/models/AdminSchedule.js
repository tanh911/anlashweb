import mongoose from "mongoose";

const adminScheduleSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },
    available_slots: [
      {
        type: String,
      },
    ],
    working_hours: {
      start: { type: String, default: "08:00" },
      end: { type: String, default: "17:00" },
    },
    is_available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "AdminSchedule",
  adminScheduleSchema,
  "adminschedules"
);
