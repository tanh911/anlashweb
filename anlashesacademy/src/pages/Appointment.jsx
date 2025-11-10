import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Appointment.css";

const API_BASE = "http://localhost:5000/api";

const Appointment = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("calendar"); // 'calendar' or 'form'

  // Form data
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_type: "Haircut",
    notes: "",
  });

  const workingHours = [
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
  const serviceTypes = [
    "Haircut",
    "Hair Color",
    "Hair Treatment",
    "Styling",
    "Other",
  ];

  // Lấy lịch rảnh khi tháng thay đổi
  useEffect(() => {
    fetchAvailableSlots();
  }, [currentDate]);

  const fetchAvailableSlots = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");

      const response = await axios.get(
        `${API_BASE}/schedule/available/${year}/${month}`
      );
      setAvailableSlots(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy lịch rảnh:", error);
    }
  };

  const fetchDailySlots = async (date) => {
    try {
      const dateString = date.toISOString().split("T")[0];
      const response = await axios.get(
        `${API_BASE}/schedule/available/date/${dateString}`
      );
      console.log(response);
      if (response.data.success) {
        return response.data.data;
      } else {
        return { freeSlots: [] };
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch theo ngày:", error);
      return { freeSlots: [] };
    }
  };

  // Kiểm tra admin có rảnh không
  const isAdminFree = (date, time) => {
    const dateString = date.toISOString().split("T")[0];
    return availableSlots[dateString]?.includes(time) || false;
  };

  // Chuyển tháng
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDate(null);
    setSelectedTime("");
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDate(null);
    setSelectedTime("");
  };

  // Xử lý chọn ngày
  const handleDateClick = async (date) => {
    if (!date || date < new Date().setHours(0, 0, 0, 0)) return;

    setSelectedDate(date);
    setSelectedTime("");
    setView("calendar");

    // Load chi tiết slots cho ngày được chọn
    const dailyData = await fetchDailySlots(date);
    const dateString = date.toISOString().split("T")[0];
    setAvailableSlots((prev) => ({
      ...prev,
      [dateString]: dailyData.freeSlots,
    }));
  };

  // Xử lý chọn giờ
  const handleTimeClick = (time) => {
    if (!selectedDate) return;

    const isFree = isAdminFree(selectedDate, time);
    if (isFree) {
      setSelectedTime(time);
      setView("form");
    }
  };

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Đặt lịch hẹn
  const handleSubmitAppointment = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      alert("Vui lòng chọn ngày và giờ");
      return;
    }

    if (!formData.customer_name || !formData.customer_phone) {
      alert("Vui lòng điền họ tên và số điện thoại");
      return;
    }

    setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split("T")[0];

      const response = await axios.post(`${API_BASE}/appointments`, {
        date: dateString,
        time: selectedTime,
        ...formData,
      });

      if (response.data.success) {
        alert(response.data.message);

        // Reset form
        setFormData({
          customer_name: "",
          customer_phone: "",
          customer_email: "",
          service_type: "Haircut",
          notes: "",
        });
        setSelectedDate(null);
        setSelectedTime("");
        setView("calendar");

        // Refresh available slots
        fetchAvailableSlots();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Có lỗi xảy ra! Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách ngày trong tháng
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
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
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="appointment-container">
      <div className="appointment-header">
        <h1>Đặt Lịch Hẹn</h1>
        <div className="calendar-nav">
          <button className="nav-btn prev" onClick={prevMonth}>
            ‹
          </button>
          <span className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button className="nav-btn next" onClick={nextMonth}>
            ›
          </button>
        </div>
      </div>

      <div className="appointment-content">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar">
            <div className="calendar-weekdays">
              {dayNames.map((day) => (
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

                const isPast = day < new Date().setHours(0, 0, 0, 0);
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate &&
                  day.toDateString() === selectedDate.toDateString();
                const hasAvailableSlots = workingHours.some((time) =>
                  isAdminFree(day, time)
                );

                return (
                  <div
                    key={index}
                    className={`calendar-day ${isPast ? "past" : ""} ${
                      isToday ? "today" : ""
                    } ${isSelected ? "selected" : ""} ${
                      hasAvailableSlots ? "has-slots" : ""
                    }`}
                    onClick={() => !isPast && handleDateClick(day)}
                  >
                    <span className="day-number">{day.getDate()}</span>
                    {hasAvailableSlots && (
                      <div className="slot-indicator"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Selection & Form Section */}
        <div className="booking-section">
          {view === "calendar" && selectedDate && (
            <div className="time-selection">
              <h3>Chọn giờ - {selectedDate.toLocaleDateString("vi-VN")}</h3>
              <div className="time-slots-grid">
                {workingHours.map((time) => {
                  const isFree = isAdminFree(selectedDate, time);

                  return (
                    <button
                      key={time}
                      className={`time-slot ${
                        isFree ? "available" : "unavailable"
                      } ${selectedTime === time ? "selected" : ""}`}
                      onClick={() => handleTimeClick(time)}
                      disabled={!isFree}
                    >
                      {time}
                      {isFree ? " ✅" : " ❌"}
                    </button>
                  );
                })}
              </div>

              {!workingHours.some((time) =>
                isAdminFree(selectedDate, time)
              ) && (
                <div className="no-slots-message">
                  <p>⚠️ Không có khung giờ trống cho ngày này</p>
                </div>
              )}
            </div>
          )}

          {view === "form" && selectedDate && selectedTime && (
            <div className="booking-form">
              <h3>Thông tin đặt lịch</h3>
              <div className="selected-time">
                <strong>
                  {selectedDate.toLocaleDateString("vi-VN")} - {selectedTime}
                </strong>
              </div>

              <form onSubmit={handleSubmitAppointment}>
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    placeholder="Nhập email (không bắt buộc)"
                  />
                </div>

                <div className="form-group">
                  <label>Dịch vụ</label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                  >
                    {serviceTypes.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú thêm (không bắt buộc)"
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setView("calendar")}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Đặt Lịch Ngay"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!selectedDate && (
            <div className="welcome-message">
              <p>Vui lòng chọn một ngày để xem giờ trống</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointment;
