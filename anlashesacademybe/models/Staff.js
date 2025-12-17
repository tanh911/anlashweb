import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên nhân viên là bắt buộc"],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
