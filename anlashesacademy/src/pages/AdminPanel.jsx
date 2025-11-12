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

  // Thêm state cho quản lý dịch vụ
  const [activeTab, setActiveTab] = useState("schedule"); // 'schedule', 'services', 'appointments'
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    isActive: true,
  });
  const [editingService, setEditingService] = useState(null);

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
    fetchServices();
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

  // Lấy danh sách dịch vụ
  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/services`);
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", error);
      // Fallback services nếu API lỗi
      setServices([
        {
          _id: "1",
          name: "Haircut",
          description: "Cắt tóc",
          duration: 60,
          price: 100000,
          isActive: true,
        },
        {
          _id: "2",
          name: "Hair Color",
          description: "Nhuộm tóc",
          duration: 120,
          price: 300000,
          isActive: true,
        },
        {
          _id: "3",
          name: "Hair Treatment",
          description: "Ủ tóc",
          duration: 90,
          price: 200000,
          isActive: true,
        },
      ]);
    }
  };

  // Thêm dịch vụ mới
  const handleAddService = async (e) => {
    e.preventDefault();

    if (!serviceForm.name.trim()) {
      alert("Vui lòng nhập tên dịch vụ");
      return;
    }

    setLoading(true);
    try {
      if (editingService) {
        // Cập nhật dịch vụ
        await axios.put(
          `${API_BASE}/services/${editingService._id}`,
          serviceForm
        );
        alert("Cập nhật dịch vụ thành công!");
      } else {
        // Thêm dịch vụ mới
        await axios.post(`${API_BASE}/services`, serviceForm);
        alert("Thêm dịch vụ thành công!");
      }

      fetchServices();
      resetServiceForm();
    } catch (error) {
      alert(error.response?.data?.error || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  // Xóa dịch vụ
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;

    try {
      await axios.delete(`${API_BASE}/services/${serviceId}`);
      alert("Xóa dịch vụ thành công!");
      fetchServices();
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa dịch vụ!", error);
    }
  };

  // Chỉnh sửa dịch vụ
  const handleEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      isActive: service.isActive,
    });
  };

  // Reset form dịch vụ
  const resetServiceForm = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      isActive: true,
    });
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
        ? prev.available_slots.filter((t) => t !== time)
        : [...prev.available_slots, time].sort();

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
        fetchSchedules();
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

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          📅 Quản lý lịch làm việc
        </button>
        <button
          className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          💇 Quản lý dịch vụ
        </button>
        <button
          className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          📋 Lịch hẹn
        </button>
      </div>

      <div className="admin-content">
        {/* Tab Quản lý lịch làm việc */}
        {activeTab === "schedule" && (
          <div className="tab-content">
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
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
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
                      return (
                        <div key={index} className="calendar-day empty"></div>
                      );
                    }

                    const dateString = day.toISOString().split("T")[0];
                    const schedule = schedules.find(
                      (s) => s.date === dateString
                    );
                    const isSelected = selectedDate === dateString;
                    const isToday =
                      day.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={index}
                        className={`calendar-day ${
                          isSelected ? "selected" : ""
                        } ${isToday ? "today" : ""} ${
                          schedule ? "has-schedule" : "no-schedule"
                        }`}
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
                        setScheduleForm((prev) => ({
                          ...prev,
                          is_available: true,
                        }))
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
          </div>
        )}

        {/* Tab Quản lý dịch vụ */}
        {activeTab === "services" && (
          <div className="tab-content">
            <div className="services-management">
              <div className="service-form-section">
                <h3>
                  {editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
                </h3>

                <form onSubmit={handleAddService} className="service-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên dịch vụ *</label>
                      <input
                        type="text"
                        value={serviceForm.name}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nhập tên dịch vụ"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Giá (VNĐ)</label>
                      <input
                        type="number"
                        value={serviceForm.price}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            price: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Nhập giá dịch vụ"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Mô tả</label>
                      <input
                        type="text"
                        value={serviceForm.description}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Mô tả dịch vụ"
                      />
                    </div>

                    <div className="form-group">
                      <label>Thời gian (phút)</label>
                      <input
                        type="number"
                        value={serviceForm.duration}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            duration: parseInt(e.target.value) || 60,
                          })
                        }
                        placeholder="Thời gian thực hiện"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={serviceForm.isActive}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      Hiển thị dịch vụ
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={loading}
                    >
                      {loading
                        ? "Đang lưu..."
                        : editingService
                        ? "Cập nhật"
                        : "Thêm dịch vụ"}
                    </button>
                    {editingService && (
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={resetServiceForm}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="services-list">
                <h3>Danh sách dịch vụ ({services.length})</h3>

                {services.map((service) => (
                  <div key={service._id} className="service-card">
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <p className="service-description">
                        {service.description}
                      </p>
                      <div className="service-meta">
                        <span className="service-duration">
                          ⏱ {service.duration} phút
                        </span>
                        <span className="service-price">
                          💰 {service.price.toLocaleString("vi-VN")}đ
                        </span>
                        <span
                          className={`service-status ${
                            service.isActive ? "active" : "inactive"
                          }`}
                        >
                          {service.isActive ? "✅ Đang hiển thị" : "❌ Đã ẩn"}
                        </span>
                      </div>
                    </div>

                    <div className="service-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditService(service)}
                      >
                        Sửa
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteService(service._id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}

                {services.length === 0 && (
                  <p className="no-data">Chưa có dịch vụ nào</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Lịch hẹn */}
        {activeTab === "appointments" && (
          <div className="tab-content">
            <div className="appointments-section">
              <h3>Lịch hẹn ({appointments.length})</h3>

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
                    <span className="status">
                      Trạng thái: {appointment.status}
                    </span>
                  </div>

                  <div className="appointment-actions">
                    {appointment.status === "pending" && (
                      <>
                        <button
                          className="confirm-btn"
                          onClick={() =>
                            handleConfirmAppointment(appointment._id)
                          }
                        >
                          Xác nhận
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() =>
                            handleCancelAppointment(appointment._id)
                          }
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
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
