import AdminSchedule from "../models/AdminSchedule.js";
import Appointment from "../models/Appointment.js";

// @desc    Get available slots for a month
// @route   GET /api/schedule/available/:year/:month
// @access  Public
const getMonthlySlots = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const monthPrefix = `${year}-${month.padStart(2, "0")}`;

    const schedules = await AdminSchedule.find({
      date: { $regex: `^${monthPrefix}` },
      is_available: true,
    }).select("date available_slots");

    const availableSlots = {};
    schedules.forEach((schedule) => {
      availableSlots[schedule.date] = schedule.available_slots;
    });

    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available slots for a specific date
// @route   GET /api/schedule/available/date/:date
// @access  Public
const getDailySlots = async (req, res, next) => {
  try {
    const date = req.params.date.trim(); // <---- thêm trim()
    console.log(">>> cleaned date =", JSON.stringify(date));

    const schedule = await AdminSchedule.findOne({ date });
    console.log(">>> schedule found =", schedule);

    const appointments = await Appointment.find({
      date,
      status: { $in: ["pending", "confirmed"] },
    });

    const bookedSlots = appointments.map((app) => app.time);
    const availableSlots = schedule ? schedule.available_slots : [];

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots,
        freeSlots: availableSlots.filter((slot) => !bookedSlots.includes(slot)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all schedules (Admin)
// @route   GET /api/schedule
// @access  Public
const getSchedules = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const schedules = await AdminSchedule.find(filter)
      .sort({ date: 1 })
      .select("-__v");

    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update schedule (Admin)
// @route   POST /api/schedule
// @access  Public
const createUpdateSchedule = async (req, res, next) => {
  try {
    const { date, available_slots, is_available } = req.body;

    const schedule = await AdminSchedule.findOneAndUpdate(
      { date },
      {
        available_slots,
        is_available: is_available !== undefined ? is_available : true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật lịch thành công",
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete schedule (Admin)
// @route   DELETE /api/schedule/:date
// @access  Public
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await AdminSchedule.findOne({ date: req.params.date });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch",
      });
    }

    await schedule.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export {
  getMonthlySlots,
  getDailySlots,
  getSchedules,
  createUpdateSchedule,
  deleteSchedule,
};
