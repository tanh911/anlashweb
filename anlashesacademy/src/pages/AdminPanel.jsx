import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPanel.css";

const API_BASE = "http://localhost:5000/api";

const AdminPanel = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form data for schedule
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    available_slots: [],
    is_available: true,
  });

  const allTimeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  // Load data khi component mount
  useEffect(() => {
    fetchSchedules();
    fetchAppointments();
  }, [currentDate]);

  // Lấy danh sách lịch làm việc
  const fetchSchedules = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;

      const response = await axios.get(
        `${API_BASE}/schedule?startDate=${startDate}&endDate=${endDate}`
      );

      if (response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch làm việc:", error);
    }
  };

  // Lấy danh sách lịch hẹn
  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/appointments`);
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch hẹn:", error);
    }
  };

  // Xử lý chọn ngày để chỉnh sửa
  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString);

    // Tìm schedule hiện tại của ngày này
    const existingSchedule = schedules.find((s) => s.date === dateString);

    if (existingSchedule) {
      setScheduleForm({
        date: existingSchedule.date,
        available_slots: existingSchedule.available_slots,
        is_available: existingSchedule.is_available,
      });
    } else {
      setScheduleForm({
        date: dateString,
        available_slots: [],
        is_available: true,
      });
    }
  };

  // Xử lý chọn/bỏ chọn khung giờ
  const handleTimeSlotToggle = (time) => {
    setScheduleForm((prev) => {
      const newSlots = prev.available_slots.includes(time)
        ? prev.available_slots.filter((t) => t !== time) // Bỏ chọn
        : [...prev.available_slots, time].sort(); // Thêm và sắp xếp

      return { ...prev, available_slots: newSlots };
    });
  };

  // Lưu lịch làm việc
  const handleSaveSchedule = async () => {
    if (!scheduleForm.date) {
      alert("Vui lòng chọn ngày!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/schedule`, scheduleForm);

      if (response.data.success) {
        alert("Cập nhật lịch thành công!");
        fetchSchedules(); // Refresh data
      }
    } catch (error) {
      alert(error.response?.data?.error || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận lịch hẹn
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      await axios.put(`${API_BASE}/appointments/${appointmentId}/confirm`);
      alert("Đã xác nhận lịch hẹn!");
      fetchAppointments();
    } catch (error) {
      alert("Có lỗi xảy ra!", error);
    }
  };

  // Hủy lịch hẹn
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;

    try {
      await axios.put(`${API_BASE}/appointments/${appointmentId}/cancel`);
      alert("Đã hủy lịch hẹn!");
      fetchAppointments();
    } catch (error) {
      alert("Có lỗi xảy ra!", error);
    }
  };

  // Tạo danh sách ngày trong tháng
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }
    return days;
  };

  const days = getDaysInMonth();
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return (
    <div className="admin-container">
      <h2>Trang quản lý Admin</h2>
      <div className="admin-header">
        <button className="">Thay đổi khung giờ làm</button>
        <button className="">Thay đổi dịch vụ</button>
      </div>

      <div className="admin-content">
        {/* Calendar để chọn ngày */}
        <div className="calendar-section">
          <div className="calendar-header">
            <button
              className="nav-btn prev"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
            >
              ‹
            </button>
            <span className="current-month">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              className="nav-btn next"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }
            >
              ›
            </button>
          </div>

          <div className="calendar">
            <div className="calendar-weekdays">
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-days">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="calendar-day empty"></div>;
                }

                const dateString = day.toISOString().split("T")[0];
                const schedule = schedules.find((s) => s.date === dateString);
                const isSelected = selectedDate === dateString;
                const isToday =
                  day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`calendar-day ${isSelected ? "selected" : ""} ${
                      isToday ? "today" : ""
                    } ${schedule ? "has-schedule" : "no-schedule"}`}
                    onClick={() => handleDateSelect(dateString)}
                  >
                    <span className="day-number">{day.getDate()}</span>
                    {schedule && schedule.available_slots.length > 0 && (
                      <div className="slot-count">
                        {schedule.available_slots.length} giờ
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form chỉnh sửa lịch */}
        {selectedDate && (
          <div className="schedule-form">
            <h3>Chỉnh sửa lịch ngày {selectedDate}</h3>

            <div className="form-group">
              <label>Trạng thái:</label>
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${
                    scheduleForm.is_available ? "active" : ""
                  }`}
                  onClick={() =>
                    setScheduleForm((prev) => ({ ...prev, is_available: true }))
                  }
                >
                  Làm việc
                </button>
                <button
                  className={`toggle-btn ${
                    !scheduleForm.is_available ? "active" : ""
                  }`}
                  onClick={() =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      is_available: false,
                      available_slots: [],
                    }))
                  }
                >
                  Nghỉ
                </button>
              </div>
            </div>

            {scheduleForm.is_available && (
              <div className="form-group">
                <label>Chọn khung giờ làm việc:</label>
                <div className="time-slots-grid">
                  {allTimeSlots.map((time) => (
                    <button
                      key={time}
                      className={`time-slot ${
                        scheduleForm.available_slots.includes(time)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleTimeSlotToggle(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="save-btn"
              onClick={handleSaveSchedule}
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu Lịch Làm Việc"}
            </button>
          </div>
        )}

        {/* Danh sách lịch hẹn */}
        <div className="appointments-section">
          <h3>Lịch hẹn</h3>

          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className={`appointment-card ${appointment.status}`}
            >
              <div className="appointment-info">
                <strong>{appointment.customer_name}</strong>
                <span>📞 {appointment.customer_phone}</span>
                <span>
                  📅 {appointment.date} - {appointment.time}
                </span>
                <span>💇 {appointment.service_type}</span>
                {appointment.notes && <span>📝 {appointment.notes}</span>}
                <span className="status">Trạng thái: {appointment.status}</span>
              </div>

              <div className="appointment-actions">
                {appointment.status === "pending" && (
                  <>
                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirmAppointment(appointment._id)}
                    >
                      Xác nhận
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelAppointment(appointment._id)}
                    >
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {appointments.length === 0 && (
            <p className="no-appointments">Chưa có lịch hẹn nào</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
