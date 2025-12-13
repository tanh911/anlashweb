// utils/dateUtils.js
export const dateUtils = {
  // Chuyển date string "YYYY-MM-DD" sang Date object với timezone Việt Nam (GMT+7)
  parseToVNDate: (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    // Tạo date với giờ 12:00:00 ở Việt Nam (GMT+7)
    // 12:00 GMT+7 = 05:00 UTC = sẽ không bị lệch ngày khi convert sang ISO
    return new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
  },

  // Format Date object sang string "YYYY-MM-DD" (luôn dùng local date)
  formatToDateString: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Format Date object sang string "YYYY-MM-DD" với UTC (để gửi API)
  formatToUTCString: (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Tạo date string cho hôm nay (YYYY-MM-DD)
  getTodayString: () => {
    const today = new Date();
    return dateUtils.formatToDateString(today);
  },

  // Kiểm tra 2 date string có cùng ngày không
  isSameDay: (dateString1, dateString2) => {
    return dateString1 === dateString2;
  },

  // Debug date
  debugDate: (label, date) => {
    console.log(`🔍 ${label}:`, {
      input: date,
      type: typeof date,
      constructor: date?.constructor?.name,
      toISOString: date?.toISOString?.(),
      toLocaleDateString: date?.toLocaleDateString?.("vi-VN"),
      getDate: date?.getDate?.(),
      getUTCDate: date?.getUTCDate?.(),
      getTimezoneOffset: date?.getTimezoneOffset?.(),
      toString: date?.toString?.(),
    });
  },

  convertDateFormat(dateString) {
    // dateString: "2025-12-10"
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  },
};
