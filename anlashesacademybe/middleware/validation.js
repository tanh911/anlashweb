const validateAppointment = (req, res, next) => {
  const { date, time, customer_name, customer_phone } = req.body;

  if (!date || !time || !customer_name || !customer_phone) {
    return res.status(400).json({
      success: false,
      error: "Vui lòng điền đầy đủ thông tin bắt buộc",
    });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      error: "Định dạng ngày không hợp lệ (YYYY-MM-DD)",
    });
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return res.status(400).json({
      success: false,
      error: "Định dạng giờ không hợp lệ (HH:MM)",
    });
  }

  next();
};

const validateSchedule = (req, res, next) => {
  const { date, available_slots } = req.body;

  if (!date || !available_slots) {
    return res.status(400).json({
      success: false,
      error: "Thiếu thông tin bắt buộc",
    });
  }

  if (!Array.isArray(available_slots)) {
    return res.status(400).json({
      success: false,
      error: "available_slots phải là mảng",
    });
  }

  next();
};

export { validateAppointment, validateSchedule };
