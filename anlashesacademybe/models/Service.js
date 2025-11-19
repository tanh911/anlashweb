import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  duration: {
    type: Number, // duration in minutes
    default: 60,
  },
  price: {
    type: Number,
    default: 0,
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
const Service = mongoose.model("Service", serviceSchema);
export default Service; // 👈 THÊM DÒNG NÀY
