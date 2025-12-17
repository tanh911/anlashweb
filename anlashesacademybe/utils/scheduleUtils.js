// utils/scheduleUtils.js

// Giờ làm việc mặc định
const DEFAULT_WORKING_HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// Kiểm tra ngày lễ
export const isHoliday = (dateString) => {
  try {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const holidays = ["01-01", "30-04", "01-05", "02-09"];

    const formattedDate = `${String(day).padStart(2, "0")}-${String(
      month
    ).padStart(2, "0")}`;
    return holidays.includes(formattedDate);
  } catch (error) {
    console.error("Error checking holiday:", error);
    return false;
  }
};

// Lấy giờ làm mặc định theo ngày (ASYNC)
export const getDefaultWorkingHours = async (dateString) => {
  try {
    if (isHoliday(dateString)) {
      return [];
    }

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    // Nếu có custom time slots từ DB

    // Fallback logic cũ
    const WORK_HOURS_CONFIG = {
      default: DEFAULT_WORKING_HOURS,
      saturday: DEFAULT_WORKING_HOURS.slice(0, -2),
      sunday: ["09:00", "10:00", "11:00", "12:00"],
    };

    if (dayOfWeek === 0) return WORK_HOURS_CONFIG.sunday;
    if (dayOfWeek === 6) return WORK_HOURS_CONFIG.saturday;
    return WORK_HOURS_CONFIG.default;
  } catch (error) {
    console.error("Error in getDefaultWorkingHours:", error);
    return DEFAULT_WORKING_HOURS;
  }
};

// Tạo schedule mặc định cho một ngày (ASYNC)
// utils/scheduleUtils.js

// Tạo schedule mặc định cho một ngày (ASYNC)
export const createDefaultSchedule = async (dateString) => {
  const isHolidayDate = isHoliday(dateString);
  const availableSlots = isHolidayDate
    ? []
    : await getDefaultWorkingHours(dateString);

  // QUAN TRỌNG: Đảm bảo có field date
  return {
    date: dateString, // THÊM DÒNG NÀY
    available_slots: availableSlots,
    is_available: !isHolidayDate,
    custom_slots: false,
    notes: isHolidayDate
      ? "Ngày lễ (tự động)"
      : `Làm việc ${availableSlots.length} giờ (mặc định)`,
  };
};

// Tạo schedules cho nhiều ngày (ASYNC)
export const generateSchedulesForDateRange = async (startDate, endDate) => {
  const schedules = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split("T")[0];
    const schedule = await createDefaultSchedule(dateString);
    schedules.push(schedule);
  }

  return schedules;
};

// Kiểm tra ngày có trong khoảng 60 ngày không
export const isWithin60Days = (dateString) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 60);

    return targetDate >= today && targetDate <= maxDate;
  } catch (error) {
    console.error("Error checking date range:", error);
    return false;
  }
};

// Lấy danh sách ngày trong khoảng
export const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateRange = [];

  const maxEndDate = new Date();
  maxEndDate.setDate(maxEndDate.getDate() + 60);
  const actualEnd = end > maxEndDate ? maxEndDate : end;

  for (let d = new Date(start); d <= actualEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dateRange.push(dateStr);
  }

  return dateRange;
};

export { DEFAULT_WORKING_HOURS };
