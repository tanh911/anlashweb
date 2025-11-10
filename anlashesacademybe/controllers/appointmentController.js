import Appointment from "../models/Appointment.js";
import AdminSchedule from "../models/AdminSchedule.js";

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

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Public
const createAppointment = async (req, res, next) => {
  try {
    const {
      date,
      time,
      customer_name,
      customer_phone,
      customer_email,
      service_type,
      notes,
    } = req.body;

    // Check if slot is available in admin schedule
    const schedule = await AdminSchedule.findOne({ date });
    if (!schedule || !schedule.available_slots.includes(time)) {
      return res.status(400).json({
        success: false,
        error: "Khung giờ này không khả dụng",
      });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        error: "Khung giờ này đã được đặt",
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      date,
      time,
      customer_name,
      customer_phone,
      customer_email,
      service_type,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận.",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Public
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

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

export {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
  cancelAppointment,
};
