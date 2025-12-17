import Appointment from "../models/Appointment.js";
import AdminSchedule from "../models/AdminSchedule.js";
import Staff from "../models/Staff.js";
import mongoose from "mongoose";

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Public
const getAppointments = async (req, res, next) => {
  try {
    const { date, phone } = req.query;

    let filter = {};
    if (date) filter.date = date;
    if (phone) filter.customer_phone = phone;

    const appointments = await Appointment.find(filter)
      .sort({ date: -1, time: -1 })
      .select("-__v")
      .limit(50);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Public
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch hẹn",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check available slots for a specific date
// @route   GET /api/appointments/availability/:date
// @access  Public
const checkAvailability = async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp ngày (định dạng YYYY-MM-DD)",
      });
    }

    // 1. Lấy admin schedule cho ngày
    const schedule = await AdminSchedule.findOne({ date });

    if (!schedule) {
      return res.json({
        success: true,
        message: "Không có lịch làm việc cho ngày này",
        data: {
          date,
          available_slots: [],
          booked_slots: [],
          all_slots: [],
        },
      });
    }

    // 2. Lấy tất cả appointment trong ngày
    const appointments = await Appointment.find({
      date,
      status: { $in: ["pending", "confirmed"] },
    }).select("time status customer_name staff_id");

    // 3. Lấy tất cả nhân viên active
    const allStaff = await Staff.find({ isActive: true });
    const totalStaff = allStaff.length;

    // 4. Tính toán cho từng slot
    const slotDetails = schedule.available_slots.map((slot) => {
      // Lấy appointments trong slot này
      const appointmentsInSlot = appointments.filter(
        (app) => app.time === slot
      );

      // Danh sách staff đã bận trong slot này
      const busyStaffIds = appointmentsInSlot
        .map((app) => app.staff_id?.toString())
        .filter(Boolean);

      // Số nhân viên còn trống
      const availableStaffCount = Math.max(0, totalStaff - busyStaffIds.length);
      const isSlotAvailable = availableStaffCount > 0;

      return {
        time: slot,
        is_available: isSlotAvailable,
        available_staff_count: availableStaffCount,
        total_staff: totalStaff,
        busy_staff_count: busyStaffIds.length,
        booked_appointments: appointmentsInSlot.map((app) => ({
          customer_name: app.customer_name,
          status: app.status,
          staff_id: app.staff_id,
        })),
      };
    });

    // 5. Lọc các slot còn trống (còn nhân viên)
    const availableSlots = slotDetails
      .filter((slot) => slot.is_available)
      .map((slot) => slot.time);

    res.json({
      success: true,
      data: {
        date,
        available_slots: availableSlots,
        slot_details: slotDetails, // Thêm chi tiết nếu cần
        total_staff: totalStaff,
        schedule_exists: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available staff for specific date and time
// @route   GET /api/appointments/available-staff
// @access  Public
const getAvailableStaff = async (req, res, next) => {
  try {
    const { date, time, service_type } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin ngày hoặc giờ",
      });
    }

    // 1. Lấy tất cả nhân viên đang active
    const allStaff = await Staff.find({ isActive: true }).select(
      "name rating specialties"
    );

    // 2. Lấy tất cả appointment trong khung giờ này
    const appointmentsInSlot = await Appointment.find({
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    }).select("staff_id");

    // 3. Lấy danh sách staff_id đã bận
    const busyStaffIds = appointmentsInSlot
      .map((app) => app.staff_id?.toString())
      .filter(Boolean);

    // 4. Lọc nhân viên còn trống (không có trong danh sách bận)
    const availableStaff = allStaff.filter(
      (staff) => !busyStaffIds.includes(staff._id.toString())
    );

    // 5. Sắp xếp theo rating (cao nhất trước)
    availableStaff.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // 6. Format response
    const formattedStaff = availableStaff.map((staff) => ({
      id: staff._id,
      name: staff.name,
      rating: staff.rating || 0,
      specialties: staff.specialties || [],
      available: true,
    }));

    res.json({
      success: true,
      data: formattedStaff,
      message: `Có ${formattedStaff.length}/${allStaff.length} nhân viên trống trong khung giờ ${time}`,
      stats: {
        available: formattedStaff.length,
        total: allStaff.length,
        busy: busyStaffIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if specific staff is available
// @route   GET /api/appointments/check-staff
// @access  Public
const checkStaffAvailability = async (req, res, next) => {
  try {
    const { staff_id, date, time } = req.query;

    if (!staff_id || !date || !time) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin staff_id, date hoặc time",
      });
    }

    // Kiểm tra nhân viên có tồn tại và active không
    const staff = await Staff.findById(staff_id);
    if (!staff || !staff.isActive) {
      return res.status(404).json({
        success: false,
        error: "Nhân viên không khả dụng",
      });
    }

    // Kiểm tra nhân viên đã có lịch trong khung giờ này chưa
    const existingAppointment = await Appointment.findOne({
      staff_id,
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    res.json({
      success: true,
      data: {
        staff_id,
        staff_name: staff.name,
        date,
        time,
        is_available: !existingAppointment,
        has_appointment: !!existingAppointment,
        appointment_info: existingAppointment
          ? {
              customer_name: existingAppointment.customer_name,
              service_type: existingAppointment.service_type,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new appointment với transaction để tránh race condition
// @route   POST /api/appointments
// @access  Public
const createAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      date,
      time,
      customer_name,
      customer_phone,
      customer_email,
      service_type,
      notes,
      staff_id,
    } = req.body;

    console.log("📥 Received appointment request:", {
      date,
      time,
      customer_name,
      customer_phone,
      staff_id,
      staff_id_type: typeof staff_id,
      staff_id_value: staff_id,
    });

    // 1. Kiểm tra input bắt buộc
    if (!date || !time || !customer_name || !customer_phone || !service_type) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // 2. Kiểm tra slot có trong admin schedule không
    const schedule = await AdminSchedule.findOne({ date }).session(session);
    if (!schedule || !schedule.available_slots.includes(time)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Khung giờ này không khả dụng",
      });
    }

    // 3. Lấy tất cả nhân viên active
    const activeStaff = await Staff.find({ isActive: true }).session(session);
    if (activeStaff.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        error: "Hiện không có nhân viên nào khả dụng",
      });
    }

    // 4. Lấy tất cả appointment đã đặt trong khung giờ này
    const existingAppointments = await Appointment.find({
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    }).session(session);

    // 5. Kiểm tra xem còn nhân viên trống không
    const busyStaffIds = existingAppointments
      .map((app) => {
        if (!app.staff_id) return null;
        // Chuyển đổi staff_id thành string để so sánh
        return app.staff_id.toString
          ? app.staff_id.toString()
          : String(app.staff_id);
      })
      .filter(Boolean);

    const availableStaff = activeStaff.filter(
      (staff) => !busyStaffIds.includes(staff._id.toString())
    );

    if (availableStaff.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        error: "Tất cả nhân viên đều bận trong khung giờ này",
        data: {
          total_staff: activeStaff.length,
          busy_staff: busyStaffIds.length,
        },
      });
    }

    let finalStaffId = staff_id;
    let autoAssigned = false;

    // 6. Hàm kiểm tra và chuẩn hóa ObjectId
    const normalizeStaffId = (id) => {
      if (!id) return null;

      // Nếu là ObjectId instance
      if (id.constructor && id.constructor.name === "ObjectId") {
        return id.toString();
      }

      // Nếu là string, kiểm tra format
      if (typeof id === "string") {
        // Xử lý nếu có 'new ObjectId(' prefix
        if (id.startsWith("new ObjectId(")) {
          const match = id.match(/'([^']+)'/);
          if (match && match[1]) {
            return match[1];
          }
        }

        // Kiểm tra nếu là ObjectId hợp lệ
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
          return id;
        }
      }

      return null;
    };

    // 7. Chuẩn hóa staff_id từ request
    const normalizedStaffId = normalizeStaffId(staff_id);
    console.log("🔄 Normalized staff_id:", {
      original: staff_id,
      normalized: normalizedStaffId,
      type: typeof staff_id,
    });

    // 8. Nếu staff_id không hợp lệ -> tự động chọn
    if (!normalizedStaffId) {
      console.log("🔄 Không có staff_id hợp lệ, tự động chọn nhân viên");

      // Tự động chọn nhân viên có rating cao nhất
      availableStaff.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const autoSelectedStaff = availableStaff[0];
      finalStaffId = autoSelectedStaff._id; // Đây là ObjectId instance
      autoAssigned = true;

      console.log("✅ Tự động chọn nhân viên:", {
        id: finalStaffId,
        name: autoSelectedStaff.name,
        rating: autoSelectedStaff.rating,
      });
    } else {
      // 9. Nếu staff_id hợp lệ
      console.log("✅ Staff ID hợp lệ từ client:", normalizedStaffId);

      // Kiểm tra nhân viên có trong danh sách available không
      const selectedStaff = availableStaff.find(
        (staff) => staff._id.toString() === normalizedStaffId
      );

      if (!selectedStaff) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          error: "Nhân viên này đã bận trong khung giờ này",
          suggestion: "Vui lòng chọn nhân viên khác hoặc để hệ thống tự chọn",
          available_staff_count: availableStaff.length,
        });
      }

      finalStaffId = new mongoose.Types.ObjectId(normalizedStaffId);
      autoAssigned = false;
    }

    // 10. Đảm bảo finalStaffId là ObjectId
    if (!finalStaffId || !(finalStaffId instanceof mongoose.Types.ObjectId)) {
      console.log(
        "⚠️ finalStaffId không phải ObjectId, chuyển đổi:",
        finalStaffId
      );

      try {
        if (typeof finalStaffId === "string") {
          finalStaffId = new mongoose.Types.ObjectId(finalStaffId);
        } else if (finalStaffId && finalStaffId.toString) {
          // Nếu có method toString(), tạo ObjectId từ string
          const idStr = finalStaffId.toString();
          if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
            finalStaffId = new mongoose.Types.ObjectId(idStr);
          } else {
            throw new Error("Invalid ObjectId string");
          }
        } else {
          throw new Error("Cannot convert to ObjectId");
        }
      } catch (error) {
        console.error("❌ Không thể chuyển đổi finalStaffId:", error);
        // Fallback: chọn nhân viên đầu tiên
        availableStaff.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        finalStaffId = availableStaff[0]._id;
        autoAssigned = true;
      }
    }

    console.log("🎯 Final staff_id for appointment:", {
      value: finalStaffId,
      type: finalStaffId.constructor.name,
      string: finalStaffId.toString(),
    });

    // 11. Tạo appointment
    const appointment = await Appointment.create(
      [
        {
          date,
          time,
          customer_name,
          customer_phone,
          customer_email,
          service_type,
          notes,
          staff_id: finalStaffId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    console.log("✅ Appointment created successfully:", {
      appointment_id: appointment[0]._id,
      date,
      time,
      staff_id: finalStaffId.toString(),
      staff_name: availableStaff.find(
        (s) => s._id.toString() === finalStaffId.toString()
      )?.name,
    });

    res.status(201).json({
      success: true,
      message: "Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận.",
      data: appointment[0],
      staff_info: {
        id: finalStaffId.toString(),
        auto_assigned: autoAssigned,
      },
      auto_assigned: autoAssigned,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error in createAppointment:", error);

    // Xử lý duplicate key error (tạm thời cho đến khi xóa index)
    if (error.code === 11000 || error.name === "MongoServerError") {
      return res.status(409).json({
        success: false,
        error: "Khung giờ này đã có lịch hẹn",
        details: "Vui lòng chọn khung giờ khác",
        suggestion:
          "Hệ thống đang được nâng cấp để hỗ trợ nhiều nhân viên trong cùng khung giờ",
        code: "DUPLICATE_SLOT_TEMPORARY",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "ID nhân viên không hợp lệ",
        details: "Vui lòng thử lại hoặc để hệ thống tự động chọn nhân viên",
      });
    }

    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Public
const updateAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { staff_id, date, time, ...otherData } = req.body;
    const appointmentId = req.params.id;

    // Lấy appointment hiện tại
    const existingAppointment = await Appointment.findById(
      appointmentId
    ).session(session);

    if (!existingAppointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch hẹn",
      });
    }

    // Nếu có thay đổi staff_id, date hoặc time, cần kiểm tra lại
    if (staff_id || date || time) {
      const checkStaffId = staff_id || existingAppointment.staff_id;
      const checkDate = date || existingAppointment.date;
      const checkTime = time || existingAppointment.time;

      // Kiểm tra slot mới có trong admin schedule không
      const schedule = await AdminSchedule.findOne({ date: checkDate }).session(
        session
      );
      if (!schedule || !schedule.available_slots.includes(checkTime)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          error: "Khung giờ mới không khả dụng",
        });
      }

      // Nếu có nhân viên, kiểm tra nhân viên có bận không
      if (checkStaffId) {
        const staff = await Staff.findById(checkStaffId).session(session);
        if (!staff || !staff.isActive) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            success: false,
            error: "Nhân viên không khả dụng",
          });
        }

        // Kiểm tra nhân viên đã có lịch khác trong khung giờ mới chưa
        const conflictingStaffAppointment = await Appointment.findOne({
          staff_id: checkStaffId,
          date: checkDate,
          time: checkTime,
          status: { $in: ["pending", "confirmed"] },
          _id: { $ne: appointmentId }, // Không tính appointment hiện tại
        }).session(session);

        if (conflictingStaffAppointment) {
          await session.abortTransaction();
          session.endSession();
          return res.status(409).json({
            success: false,
            error: `Nhân viên ${staff.name} đã có lịch trong khung giờ mới`,
          });
        }
      } else {
        // Nếu không có nhân viên, kiểm tra slot đã được đặt chưa
        const conflictingAppointment = await Appointment.findOne({
          date: checkDate,
          time: checkTime,
          status: { $in: ["pending", "confirmed"] },
          _id: { $ne: appointmentId },
        }).session(session);

        if (conflictingAppointment) {
          await session.abortTransaction();
          session.endSession();
          return res.status(409).json({
            success: false,
            error: "Khung giờ mới đã được đặt bởi lịch hẹn khác",
          });
        }
      }
    }

    // Update appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        staff_id: staff_id || existingAppointment.staff_id,
        date: date || existingAppointment.date,
        time: time || existingAppointment.time,
        ...otherData,
      },
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Public
const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch hẹn",
      });
    }

    await appointment.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm appointment (Admin)
// @route   PUT /api/appointments/:id/confirm
// @access  Public
const confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "confirmed" },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch hẹn",
      });
    }

    res.json({
      success: true,
      message: "Đã xác nhận lịch hẹn",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment (Admin)
// @route   PUT /api/appointments/:id/cancel
// @access  Public
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch hẹn",
      });
    }

    res.json({
      success: true,
      message: "Đã hủy lịch hẹn",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Get slot details with staff availability
// @route   GET /api/appointments/slot-details
// @access  Public
const getSlotDetails = async (req, res, next) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin ngày hoặc giờ",
      });
    }

    // 1. Lấy tất cả nhân viên active
    const allStaff = await Staff.find({ isActive: true }).select(
      "name rating specialties"
    );

    // 2. Lấy tất cả appointment trong khung giờ này
    const appointmentsInSlot = await Appointment.find({
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    }).select("staff_id customer_name service_type");

    // 3. Tạo mapping nhân viên đã bận
    const busyStaffMap = {};
    appointmentsInSlot.forEach((app) => {
      if (app.staff_id) {
        busyStaffMap[app.staff_id.toString()] = {
          customer_name: app.customer_name,
          service_type: app.service_type,
        };
      }
    });

    // 4. Phân loại nhân viên
    const staffDetails = allStaff.map((staff) => {
      const isBusy = busyStaffMap[staff._id.toString()];
      return {
        id: staff._id,
        name: staff.name,
        rating: staff.rating || 0,
        specialties: staff.specialties || [],
        is_available: !isBusy,
        current_appointment: isBusy || null,
      };
    });

    // 5. Sắp xếp: nhân viên trống trước, sau đó theo rating
    staffDetails.sort((a, b) => {
      if (a.is_available !== b.is_available) {
        return a.is_available ? -1 : 1;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    res.json({
      success: true,
      data: {
        date,
        time,
        total_staff: allStaff.length,
        available_count: staffDetails.filter((s) => s.is_available).length,
        busy_count: staffDetails.filter((s) => !s.is_available).length,
        staff_details: staffDetails,
        appointments: appointmentsInSlot,
      },
    });
  } catch (error) {
    next(error);
  }
};
export {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
  cancelAppointment,
  checkAvailability,
  getAvailableStaff, // Đổi tên từ checkStaffAvailability
  checkStaffAvailability, // Giữ lại để kiểm tra nhân viên cụ thể
  getSlotDetails,
};
