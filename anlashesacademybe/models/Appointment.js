import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, "Vui lòng thêm ngày"],
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "Định dạng ngày không hợp lệ (YYYY-MM-DD)",
      ],
      index: true,
    },
    time: {
      type: String,
      required: [true, "Vui lòng thêm giờ"],
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Định dạng giờ không hợp lệ (HH:MM)",
      ],
      index: true,
    },
    customer_name: {
      type: String,
      required: [true, "Vui lòng thêm tên khách hàng"],
      trim: true,
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },
    customer_phone: {
      type: String,
      required: [true, "Vui lòng thêm số điện thoại"],
      trim: true,
      maxlength: [20, "Số điện thoại không được vượt quá 20 ký tự"],
    },
    customer_email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },
    service_type: {
      type: String,
      required: [true, "Vui lòng thêm loại dịch vụ"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    notes: {
      type: String,
      maxlength: [500, "Ghi chú không được vượt quá 500 ký tự"],
    },
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: [true, "Vui lòng chọn nhân viên"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index để tránh double booking
// appointmentSchema.index(
//   { date: 1, time: 1 },
//   {
//     unique: true,
//     partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
//   }
// );
appointmentSchema.index(
  {
    date: 1,
    time: 1,
    staff_id: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
      staff_id: { $exists: true, $ne: null },
    },
  }
);
export default mongoose.model("Appointment", appointmentSchema);
