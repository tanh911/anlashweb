// controllers/scheduleController.js
import AdminSchedule from "../models/AdminSchedule.js";
import Appointment from "../models/Appointment.js";
import {
  isHoliday,
  createDefaultSchedule,
  generateSchedulesForDateRange,
  isWithin60Days,
  getDateRange,
  DEFAULT_WORKING_HOURS,
} from "../utils/scheduleUtils.js";

// @desc    Cập nhật danh sách giờ làm việc (Admin)
// @route   PUT /api/schedule/time-slots
// @access  Private/Admin
const updateTimeSlots = async (req, res, next) => {
  try {
    return res.status(501).json({
      success: false,
      error:
        "Chức năng này đang phát triển. Vui lòng sửa trực tiếp trong scheduleUtils.js",
    });
  } catch (error) {
    console.error("❌ Error in updateTimeSlots:", error);
    next(error);
  }
};

// Hàm helper cho timezone
const normalizeDateForTimezone = (dateString) => {
  if (!dateString || typeof dateString !== "string") return null;
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [_, year, month, day] = match;
  const date = new Date(
    Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
  );

  const utcYear = date.getUTCFullYear();
  const utcMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const utcDay = String(date.getUTCDate()).padStart(2, "0");

  return `${utcYear}-${utcMonth}-${utcDay}`;
};

// @desc    Khởi tạo schedules mặc định
// @route   POST /api/schedule/init-default
// @access  Private/Admin
const initDefaultSchedules = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 60);

    const startDate = today.toISOString().split("T")[0];
    const endDate = targetDate.toISOString().split("T")[0];

    console.log(`📅 Khởi tạo lịch từ ${startDate} đến ${endDate}`);

    const dateRange = getDateRange(startDate, endDate);
    const existingSchedules = await AdminSchedule.find({
      date: { $gte: startDate, $lte: endDate },
    }).select("date");

    const existingDates = new Set(existingSchedules.map((s) => s.date));
    const schedulesToCreate = [];

    // Tạo schedules async
    for (const date of dateRange) {
      if (!existingDates.has(date)) {
        const schedule = await createDefaultSchedule(date);
        schedulesToCreate.push(schedule);
      }
    }

    let createdCount = 0;
    if (schedulesToCreate.length > 0) {
      const result = await AdminSchedule.insertMany(schedulesToCreate, {
        ordered: false,
      });
      createdCount = result.length;
      console.log(`✅ Đã tạo ${createdCount} schedules`);
    }

    const totalSchedules = await AdminSchedule.countDocuments({
      date: { $gte: startDate, $lte: endDate },
    });

    res.json({
      success: true,
      message: "Khởi tạo lịch thành công",
      data: {
        created: createdCount,
        total: totalSchedules,
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch làm việc theo tháng
// @route   GET /api/schedule/available/:year/:month
// @access  Public
const getMonthlySlots = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const monthPrefix = `${year}-${month.padStart(2, "0")}`;

    const today = new Date();
    const normalizedToday = new Date(today.toISOString().split("T")[0]);
    const maxDate = new Date(normalizedToday);
    maxDate.setDate(normalizedToday.getDate() + 60);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    const schedules = await AdminSchedule.find({
      date: { $regex: `^${monthPrefix}` },
    });

    const scheduleMap = {};
    schedules.forEach((schedule) => {
      scheduleMap[schedule.date] = schedule;
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const availableSlots = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${monthPrefix}-${day.toString().padStart(2, "0")}`;

      if (dateString > maxDateStr) {
        availableSlots[dateString] = [];
        continue;
      }

      if (scheduleMap[dateString]) {
        const schedule = scheduleMap[dateString];
        availableSlots[dateString] = schedule.is_available
          ? schedule.available_slots
          : [];
      } else {
        // Sử dụng DEFAULT_WORKING_HOURS cho ngày không có schedule
        const isHolidayDate = isHoliday(dateString);
        availableSlots[dateString] = isHolidayDate ? [] : DEFAULT_WORKING_HOURS;
      }
    }

    res.json({
      success: true,
      data: availableSlots,
      max_date: maxDateStr,
      message: `Lịch làm việc tháng ${month}/${year}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch làm việc theo ngày
// @route   GET /api/schedule/available/date/:date
// @access  Public
const getDailySlots = async (req, res, next) => {
  try {
    let date = req.params.date.trim();
    const normalizedDate = normalizeDateForTimezone(date);
    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        error: "Date format không hợp lệ",
      });
    }
    date = normalizedDate;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: "Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD",
      });
    }

    if (!isWithin60Days(date)) {
      return res.status(400).json({
        success: false,
        error: "Chỉ có thể xem lịch trong vòng 60 ngày tới",
      });
    }

    const schedule = await AdminSchedule.findOne({ date });
    let finalSchedule;

    if (!schedule) {
      // Nếu chưa có schedule, tạo mặc định
      const isHolidayDate = isHoliday(date);
      finalSchedule = {
        date,
        available_slots: isHolidayDate ? [] : DEFAULT_WORKING_HOURS,
        is_available: !isHolidayDate,
        custom_slots: false,
        notes: isHolidayDate ? "Ngày lễ (mặc định)" : "Lịch làm việc mặc định",
      };
    } else {
      finalSchedule = schedule;
    }

    const appointments = await Appointment.find({
      date,
      status: { $in: ["pending", "confirmed"] },
    });

    const bookedSlots = appointments.map((app) => app.time);
    const availableSlots = finalSchedule.is_available
      ? finalSchedule.available_slots
      : [];

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots,
        freeSlots: availableSlots.filter((slot) => !bookedSlots.includes(slot)),
        is_available: finalSchedule.is_available,
        custom_slots: finalSchedule.custom_slots,
        notes: finalSchedule.notes,
        auto_generated: !finalSchedule.custom_slots,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy schedules theo khoảng ngày
// @route   GET /api/schedule
// @access  Public
const getSchedules = async (req, res, next) => {
  try {
    const { startDate, endDate, showAll = "false" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp startDate và endDate",
      });
    }

    let schedules = [];

    if (showAll === "true") {
      const dateRange = getDateRange(startDate, endDate);
      const dbSchedules = await AdminSchedule.find({
        date: { $gte: startDate, $lte: endDate },
      })
        .sort({ date: 1 })
        .lean();

      const scheduleMap = {};
      dbSchedules.forEach((s) => {
        scheduleMap[s.date] = s;
      });

      // Xử lý async trong map
      const schedulePromises = dateRange.map(async (dateStr) => {
        if (scheduleMap[dateStr]) {
          return {
            ...scheduleMap[dateStr],
            auto_generated: false,
          };
        } else {
          const isHolidayDate = isHoliday(dateStr);
          const defaultSlots = isHolidayDate ? [] : DEFAULT_WORKING_HOURS;

          return {
            date: dateStr,
            available_slots: defaultSlots,
            is_available: !isHolidayDate,
            custom_slots: false,
            notes: isHolidayDate
              ? "Ngày lễ (mặc định)"
              : "Lịch làm việc mặc định",
            _id: null,
            auto_generated: true,
            __v: 0,
          };
        }
      });

      schedules = await Promise.all(schedulePromises);
    } else {
      schedules = await AdminSchedule.find({
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 });
    }

    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
      query: { startDate, endDate, showAll },
      generated: schedules.filter((s) => s.auto_generated).length,
    });
  } catch (error) {
    console.error("❌ Error in getSchedules:", error);
    next(error);
  }
};

// @desc    Tạo hoặc cập nhật schedule (Admin)
// @route   POST /api/schedule
// @access  Private/Admin
const createUpdateSchedule = async (req, res, next) => {
  try {
    const {
      date,
      available_slots = [],
      is_available = true,
      notes = "",
    } = req.body;

    // Validate date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: "Ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD",
      });
    }

    // Kiểm tra ngày có trong 60 ngày tới không
    if (!isWithin60Days(date)) {
      return res.status(400).json({
        success: false,
        error: "Chỉ có thể chỉnh sửa lịch trong vòng 60 ngày tới",
      });
    }

    // Validate time slots
    const validSlots = available_slots.filter((slot) =>
      /^\d{2}:\d{2}$/.test(slot)
    );

    const schedule = await AdminSchedule.findOneAndUpdate(
      { date },
      {
        available_slots: is_available ? validSlots : [],
        is_available,
        custom_slots: true, // Đánh dấu admin đã chỉnh sửa
        notes: notes.trim(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
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

// @desc    Xóa schedule (Admin)
// @route   DELETE /api/schedule/:date
// @access  Private/Admin
const deleteSchedule = async (req, res, next) => {
  try {
    const { date } = req.params;

    const schedule = await AdminSchedule.findOne({ date });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch",
      });
    }

    await schedule.deleteOne();

    res.json({
      success: true,
      message: "Đã xóa lịch",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset schedule về mặc định
// @route   POST /api/schedule/reset/:date
// @access  Private/Admin
const resetSchedule = async (req, res, next) => {
  try {
    const { date } = req.params;

    const isHolidayDate = isHoliday(date);
    const defaultSlots = isHolidayDate ? [] : DEFAULT_WORKING_HOURS;

    const schedule = await AdminSchedule.findOneAndUpdate(
      { date },
      {
        available_slots: defaultSlots,
        is_available: !isHolidayDate,
        custom_slots: false, // Reset về không custom
        notes: isHolidayDate ? "Ngày lễ (mặc định)" : "Lịch làm việc mặc định",
      },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lịch",
      });
    }

    res.json({
      success: true,
      message: "Đã reset lịch về mặc định",
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật hàng loạt (Admin)
// @route   POST /api/schedule/batch
// @access  Private/Admin
const batchUpdateSchedules = async (req, res, next) => {
  try {
    const { dates, is_available, available_slots = [], notes = "" } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp danh sách ngày",
      });
    }

    // Validate tất cả ngày
    const validDates = dates.filter(
      (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && isWithin60Days(date)
    );

    if (validDates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Không có ngày hợp lệ trong danh sách",
      });
    }

    const operations = validDates.map((date) => ({
      updateOne: {
        filter: { date },
        update: {
          available_slots: is_available ? available_slots : [],
          is_available: is_available !== undefined ? is_available : true,
          custom_slots: true,
          notes: notes || `Batch update: ${is_available ? "Mở" : "Đóng"}`,
        },
        upsert: true,
      },
    }));

    const result = await AdminSchedule.bulkWrite(operations);

    res.json({
      success: true,
      message: `Đã cập nhật ${
        result.upsertedCount + result.modifiedCount
      } ngày`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kiểm tra health của schedule service
// @route   GET /api/schedule/health
// @access  Public
const getHealth = async (req, res) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 60);

    const scheduleCount = await AdminSchedule.countDocuments({
      date: {
        $gte: today.toISOString().split("T")[0],
        $lte: futureDate.toISOString().split("T")[0],
      },
    });

    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        schedules: {
          total: await AdminSchedule.countDocuments(),
          next_60_days: scheduleCount,
          should_have: 61,
        },
        default_working_hours: DEFAULT_WORKING_HOURS,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  initDefaultSchedules,
  getMonthlySlots,
  getDailySlots,
  getSchedules,
  createUpdateSchedule,
  deleteSchedule,
  resetSchedule,
  batchUpdateSchedules,
  getHealth,
  updateTimeSlots,
};
