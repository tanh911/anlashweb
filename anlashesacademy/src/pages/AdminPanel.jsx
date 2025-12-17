// AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AdminPanel.css";
import { dateUtils } from "../utils/dateUtils";
import StaffForm from "../component/StaffForm.jsx";
const API_BASE = import.meta.env.VITE_API_URL;

const AUTH_HEADER = { Authorization: "Bearer admin-secret-token" };
const ALL_TIME_SLOTS = [
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
  "19:00",
];
const AdminPanel = () => {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [schedules, setSchedules] = useState({}); // Đã đổi thành object
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  const [staffNames, setStaffNames] = useState({});
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    isActive: true,
  });
  const [editingService, setEditingService] = useState(null);

  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    available_slots: [],
    is_available: true,
  });

  const [appointmentsByDate, setAppointmentsByDate] = useState({});
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);

  const [staffList, setStaffList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", _id: null });
  const [staffLoading, setStaffLoading] = useState(false);
  useEffect(() => {
    fetchSchedules();
    fetchAppointments();
    fetchServices();
    loadAppointmentsForMonth();
  }, [currentDate]);

  useEffect(() => {
    if (selectedDate) {
      checkAppointmentsForDate(selectedDate);
      timeSlotFetch(selectedDate);
    }
  }, [selectedDate]);

  const staffListFetch = async () => {
    try {
      const response = await axios.get(`${API_BASE}/staff`, {
        headers: AUTH_HEADER,
      });
      if (response.data.success) {
        setStaffList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
      setStaffList([]);
    }
  };

  useEffect(() => {
    staffListFetch();
  }, []);
  useEffect(() => {
    const fetchAllStaffNames = async () => {
      const uniqueStaffIds = [
        ...new Set(appointments.map((app) => app.staff_id).filter(Boolean)),
      ];

      // Kiểm tra xem đã fetch hết chưa
      const missingStaffIds = uniqueStaffIds.filter((id) => !staffNames[id]);

      if (missingStaffIds.length === 0) return;

      try {
        // Fetch từng staff một
        const promises = missingStaffIds.map(async (staffId) => {
          try {
            const response = await axios.get(`${API_BASE}/staff/${staffId}`, {
              headers: AUTH_HEADER,
            });
            if (response.data.success && response.data.data) {
              return { id: staffId, name: response.data.data.name };
            }
          } catch (error) {
            console.error(`Error fetching staff ${staffId}:`, error);
            return { id: staffId, name: "Unknown Staff" };
          }
        });

        const results = await Promise.allSettled(promises);
        const newStaffNames = {};

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            newStaffNames[result.value.id] = result.value.name;
          }
        });

        setStaffNames((prev) => ({ ...prev, ...newStaffNames }));
      } catch (error) {
        console.error("Error fetching staff names:", error);
      }
    };

    if (appointments.length > 0) {
      fetchAllStaffNames();
    }
  }, [appointments]);

  // Thêm useEffect để cập nhật allTimeSlots khi chọn ngày
  const timeSlotFetch = async (date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const dateString = dateUtils.formatToDateString(dateObj);
      const response = await axios.get(
        `${API_BASE}/schedule/available/date/${dateString}`
      );

      if (response.data.success && response.data.data) {
        const scheduleData = response.data.data;
        const availableSlots = scheduleData.availableSlots || [];
        // Lưu danh sách tất cả slot mặc định
        setAllTimeSlots(ALL_TIME_SLOTS);
        console.log(availableSlots);
        // Nếu đây là ngày được chọn, cập nhật form
        console.log("selected date");
        // Tính toán giờ bị bỏ chọn
        const excludedSlots = ALL_TIME_SLOTS.filter(
          (time) => !availableSlots.includes(time)
        );
        console.log(excludedSlots);
        setScheduleForm({
          date: dateString,
          available_slots: excludedSlots ? availableSlots : [],
          is_available: availableSlots.length > 0,
        });
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setAllTimeSlots([]);
    }
  };

  const loadAppointmentsForMonth = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");

      // Preload appointments for visible month if you have an API endpoint
      // For now, we'll use the existing appointments data
      console.log("Loading appointments for month:", year, month);
    } catch (error) {
      console.error("Error loading appointments for month:", error);
    }
  };

  const checkAppointmentsForDate = async (date) => {
    try {
      const response = await axios.get(
        `${API_BASE}/appointments/availability/${date}`
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const bookedSlots = data.slot_details
          ? data.slot_details
              .filter((slot) => slot.busy_staff_count > 0) // Slot có nhân viên bận
              .map((slot) => ({
                time: slot.time,
                booked_count: slot.busy_staff_count,
                available_count: slot.available_staff_count,
                total_staff: slot.total_staff,
              }))
          : [];

        // Lưu vào state theo ngày
        setAppointmentsByDate((prev) => ({
          ...prev,
          [date]: bookedSlots,
        }));

        // Lưu appointments cho ngày được chọn
        setSelectedDateAppointments(bookedSlots);

        return bookedSlots;
      }

      return [];
    } catch (error) {
      console.error(`Error checking appointments for ${date}:`, error);
      setAppointmentsByDate((prev) => ({
        ...prev,
        [date]: [],
      }));
      return [];
    }
  };

  // Hàm kiểm tra một ngày cụ thể có appointments không
  const hasAppointmentsOnDate = (dateString) => {
    const appointments = appointmentsByDate[dateString];
    return appointments && appointments.length > 0;
  };

  const fetchSchedules = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const response = await axios.get(
        `${API_BASE}/schedule/available/${year}/${month}`
      );
      if (response.data.success) {
        // QUAN TRỌNG: Đảm bảo schedules là object với key là date string
        const schedulesData = response.data.data || {};
        console.log("📅 Schedules fetched:", Object.keys(schedulesData).length);
        setSchedules(schedulesData);
      }
    } catch (err) {
      console.error(err);
      setSchedules({});
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/appointments`);
      if (response.data.success) {
        setAppointments(response.data.data);

        // Tạo appointmentsByDate từ appointments
        const byDate = {};
        response.data.data.forEach((app) => {
          if (!byDate[app.date]) {
            byDate[app.date] = [];
          }
          byDate[app.date].push(app);
        });
        setAppointmentsByDate(byDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/services`);
      if (response.data.success) setServices(response.data.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", err);
      setServices([]);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      alert("Vui lòng nhập tên dịch vụ");
      return;
    }
    setLoading(true);
    try {
      if (editingService) {
        await axios.put(
          `${API_BASE}/services/${editingService._id}`,
          serviceForm,
          { headers: AUTH_HEADER }
        );
        alert("Cập nhật dịch vụ thành công!");
      } else {
        await axios.post(`${API_BASE}/services`, serviceForm, {
          headers: AUTH_HEADER,
        });
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

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;
    try {
      await axios.delete(`${API_BASE}/services/${serviceId}`, {
        headers: AUTH_HEADER,
      });
      alert("Xóa dịch vụ thành công!");
      fetchServices();
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa dịch vụ!", error);
    }
  };

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

  const handleDateSelect = (date) => {
    if (!date) return;

    const dateObj = typeof date === "string" ? new Date(date) : date;
    const dateString = dateUtils.formatToDateString(dateObj);

    setSelectedDate(dateString);
    checkAppointmentsForDate(dateString);

    // const existingSchedule = schedules[dateString];
    // if (existingSchedule) {
    //   // Nếu có schedule trong DB
    //   const isAvailable = existingSchedule.is_available !== false;
    //   const workingSlotsFromDB = allTimeSlots || [];

    //   // Tính toán giờ bị loại trừ (giờ mà backend có nhưng admin đã bỏ)
    //   const excludedSlots = allTimeSlots.filter(
    //     (time) => !workingSlotsFromDB.includes(time)
    //   );

    //   setScheduleForm({
    //     date: dateString,
    //     available_slots: excludedSlots, // Đây là giờ bị admin bỏ chọn
    //     is_available: isAvailable,
    //   });
    // } else {
    //   // Nếu chưa có schedule, mặc định là làm việc với tất cả slots
    //   console.log("📋 No schedule in DB, using all slots as active");
    //   setScheduleForm({
    //     date: dateString,
    //     available_slots: [], // Không có giờ nào bị loại trừ
    //     is_available: true,
    //   });
    // }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.date) {
      alert("Vui lòng chọn ngày!");
      return;
    }

    // Tính toán giờ thực sự làm việc (giờ mặc định TRỪ giờ bị admin bỏ)
    console.log(scheduleForm);
    // const workingSlots = allTimeSlots.filter(
    //   (time) => !scheduleForm.available_slots?.includes(time)
    // );
    const workingSlots = scheduleForm.available_slots || [];
    console.log(workingSlots);
    const workingSlotsCount = workingSlots.length;
    console.log(workingSlotsCount);
    // Kiểm tra nếu có appointments trong giờ bị bỏ
    const hasAppointmentsInExcludedSlots = scheduleForm.available_slots.some(
      (time) => selectedDateAppointments.some((app) => app.time === time)
    );

    if (hasAppointmentsInExcludedSlots) {
      alert("⚠️ Không thể lưu vì có giờ bạn muốn bỏ đã có lịch hẹn!");
      return;
    }
    // Nếu đang ở chế độ "Làm việc" nhưng không có giờ nào
    if (scheduleForm.is_available && workingSlotsCount === 0) {
      const choice = window.confirm(
        "Bạn đã bỏ chọn tất cả giờ làm việc.\n\n" +
          "Bạn có muốn:\n" +
          "1. Chọn lại một vài giờ làm việc\n" +
          "2. Chuyển sang 'Nghỉ'\n\n" +
          "Nhấn OK để chọn giờ, Cancel để chuyển sang Nghỉ."
      );

      if (choice) {
        return;
      } else {
        setScheduleForm((prev) => ({
          ...prev,
          is_available: false,
          available_slots: [...allTimeSlots],
        }));
        return;
      }
    }

    setLoading(true);
    try {
      const dataToSend = {
        date: scheduleForm.date,
        is_available: scheduleForm.is_available,
        // Gửi giờ LÀM VIỆC lên server (giờ mặc định trừ giờ bị bỏ)
        available_slots: scheduleForm.is_available ? workingSlots : [],
        notes: scheduleForm.is_available
          ? `Làm việc ${workingSlotsCount} giờ (${workingSlots.join(", ")})`
          : "Ngày nghỉ",
      };

      console.log("📤 Saving to server:", dataToSend);

      const response = await axios.post(`${API_BASE}/schedule`, dataToSend, {
        headers: AUTH_HEADER,
      });

      if (response.data.success) {
        alert("✅ Cập nhật lịch thành công!");
        await fetchSchedules();
        await checkAppointmentsForDate(scheduleForm.date);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert(error.response?.data?.error || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/confirm`,
        {},
        { headers: AUTH_HEADER }
      );
      alert("Đã xác nhận lịch hẹn!");
      fetchAppointments();
      // Refresh selected date appointments
      if (selectedDate) {
        checkAppointmentsForDate(selectedDate);
      }
    } catch (error) {
      alert("Có lỗi xảy ra!", error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/cancel`,
        {},
        { headers: AUTH_HEADER }
      );
      alert("Đã hủy lịch hẹn!");
      fetchAppointments();
      // Refresh selected date appointments
      if (selectedDate) {
        checkAppointmentsForDate(selectedDate);
      }
    } catch (error) {
      alert("Có lỗi xảy ra!", error);
    }
  };

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
      const date = new Date(year, month, i, 12, 0, 0);
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

  const handleEditStaff = async (staff) => {
    try {
      // Hiển thị form với dữ liệu nhân viên hiện tại
      setNewStaff({
        _id: staff._id,
        name: staff.name,
      });
      setShowAddForm(true);

      // Có thể thêm animation hoặc focus vào form
      setTimeout(() => {
        const nameInput = document.querySelector(
          '.modal-content input[name="name"]'
        );
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }, 100);
    } catch (error) {
      console.error("Lỗi khi mở form chỉnh sửa:", error);
      alert("Có lỗi xảy ra khi mở form chỉnh sửa");
    }
  };

  // Function 2: Xử lý xóa nhân viên
  const handleDeleteStaff = async (staffId) => {
    // Hiển thị hộp thoại xác nhận
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa nhân viên này?\n\n" +
        "Hành động này không thể hoàn tác."
    );

    if (!isConfirmed) return;

    try {
      setStaffLoading(true);

      // Gọi API xóa nhân viên
      const response = await axios.delete(`${API_BASE}/staff/${staffId}`, {
        headers: AUTH_HEADER,
      });

      if (response.data.success) {
        // Cập nhật danh sách nhân viên (loại bỏ nhân viên đã xóa)
        setStaffList((prev) => prev.filter((staff) => staff._id !== staffId));

        // Hiển thị thông báo thành công
        alert("✅ Đã xóa nhân viên thành công!");

        // Có thể thêm hiệu ứng visual
        const deletedRow = document.querySelector(
          `[data-staff-id="${staffId}"]`
        );
        if (deletedRow) {
          deletedRow.style.transition = "all 0.3s ease";
          deletedRow.style.opacity = "0";
          deletedRow.style.transform = "translateX(-100px)";

          setTimeout(() => {
            // Element sẽ được xóa khỏi DOM bởi React re-render
          }, 300);
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa nhân viên:", error);

      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        switch (error.response.status) {
          case 404:
            alert("❌ Không tìm thấy nhân viên để xóa");
            break;
          case 400:
            alert(
              "❌ " +
                (error.response.data.message || "Không thể xóa nhân viên này")
            );
            break;
          case 500:
            alert("⚠️ Lỗi server, vui lòng thử lại sau");
            break;
          default:
            alert(
              "❌ Có lỗi xảy ra: " +
                (error.response.data.message || error.message)
            );
        }
      } else if (error.request) {
        alert("⚠️ Không thể kết nối đến server");
      } else {
        alert("❌ Có lỗi xảy ra: " + error.message);
      }
    } finally {
      setStaffLoading(false);
    }
  };

  const handleSaveStaff = async (staffData) => {
    try {
      setStaffLoading(true);

      let response;
      if (staffData._id) {
        // Update existing staff
        response = await axios.put(
          `${API_BASE}/staff/${staffData._id}`,
          {
            name: staffData.name,
          },
          {
            headers: AUTH_HEADER,
          }
        );

        if (response.data.success) {
          // Update in list
          setStaffList((prev) =>
            prev.map((staff) =>
              staff._id === staffData._id ? response.data.data : staff
            )
          );
          alert("Cập nhật nhân viên thành công!");
        }
      } else {
        // Create new staff
        response = await axios.post(
          `${API_BASE}/staff/create`,
          {
            name: staffData.name,
          },
          {
            headers: AUTH_HEADER,
          }
        );

        if (response.data.success) {
          // Add to list
          setStaffList((prev) => [...prev, response.data.data]);
          alert("Thêm nhân viên mới thành công!");
        }
      }

      // Refresh staff list
      await staffListFetch();
      setShowAddForm(false);
      setNewStaff({ name: "", _id: null });
    } catch (error) {
      console.error("Lỗi khi lưu nhân viên:", error);
      alert(
        "Có lỗi xảy ra: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setStaffLoading(false);
    }
  };
  const handleCloseStaffForm = useCallback(() => {
    setShowAddForm(false);
    setNewStaff({ name: "", _id: null });
  }, []);

  // const handleStaffChange = useCallback((data) => {
  //   setNewStaff(data);
  // }, []);
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    try {
      await axios.delete(`${API_BASE}/appointments/${appointmentId}`, {
        headers: AUTH_HEADER,
      });
      alert("Đã hủy lịch hẹn!");
      fetchAppointments();
      // Refresh selected date appointments
      if (selectedDate) {
        checkAppointmentsForDate(selectedDate);
      }
    } catch (error) {
      alert("Có lỗi xảy ra!", error);
    }
  };
  return (
    <div className="admin-container">
      <div className="admin-tabs">
        <h2>Trang Quản Lý Admin</h2>
        <button
          className={`tab-btn ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          📅 Quản Lý Lịch Làm Việc
        </button>
        <button
          className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          💇 Quản Lý Dịch Vụ
        </button>
        <button
          className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          📋 Lịch Hẹn
        </button>
        <button
          className={`tab-btn ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          🧑‍💼Nhân Viên
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "schedule" && (
          <div className="tab-content">
            <div className="calendar-box">
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
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                      <div key={d} className="weekday">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {days.map((day, index) => {
                      if (!day)
                        return (
                          <div key={index} className="calendar-day empty"></div>
                        );

                      const isPast = day < new Date().setHours(0, 0, 0, 0);
                      const dateString = dateUtils.formatToDateString(day);
                      const schedule = schedules[dateString]; // Đã là object
                      const isSelected = selectedDate === dateString;
                      const isToday =
                        day.toDateString() === new Date().toDateString();

                      // QUAN TRỌNG: Kiểm tra ngày này có appointments không
                      const hasAppointments = hasAppointmentsOnDate(dateString);

                      // KIỂM TRA NGÀY NGHỈ: is_available = false HOẶC available_slots rỗng
                      const isDayOff = schedule
                        ? schedule.is_available === false ||
                          schedule.available_slots?.length === 0
                        : false;

                      return (
                        <div
                          key={index}
                          className={`calendar-day
                            ${isPast ? "past" : ""}
                            ${isSelected ? "selected" : ""}
                            ${isToday ? "today" : ""}
                            ${isDayOff ? "day-off" : ""}
                            ${schedule ? "has-schedule" : "no-schedule"}`}
                          onClick={() =>
                            !isPast && handleDateSelect(dateString)
                          }
                          title={
                            isDayOff
                              ? "Ngày nghỉ"
                              : schedule
                              ? `Làm việc ${
                                  schedule.available_slots?.length || 0
                                } giờ`
                              : "Chưa có lịch"
                          }
                        >
                          <span className="day-number">{day.getDate()}</span>

                          {/* HIỂN THỊ SLOT INDICATOR NẾU CÓ APPOINTMENTS */}
                          {hasAppointments && !isDayOff && (
                            <div className="slot-indicator-admin">
                              <span className="appointment-dot"></span>
                            </div>
                          )}

                          {/* INDICATOR CHO NGÀY NGHỈ */}
                          {isDayOff && (
                            <div className="day-off-indicator">❌</div>
                          )}

                          {schedule &&
                            !isDayOff &&
                            Array.isArray(schedule.available_slots) &&
                            schedule.available_slots.length > 0 && (
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
            </div>

            {selectedDate && selectedDateAppointments.length > 0 && (
              <div className="appointment-notification">
                <div className="notification-header">
                  <span className="notification-icon"></span>
                  <span>
                    Có {selectedDateAppointments.length} lịch hẹn ngày{" "}
                    {selectedDate}
                  </span>
                </div>
                <div className="appointment-details">
                  {selectedDateAppointments.map((slot, index) => (
                    <div key={index} className="appointment-slot">
                      <span className="appointment-time">{slot.time}</span>
                      <span className="appointment-name">
                        {slot.customer_name}
                      </span>
                      <span className={`status-badge ${slot.status}`}>
                        {slot.status === "pending"
                          ? "⏳ Chờ"
                          : "✅ Đã xác nhận"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && (
              <div className="schedule-form">
                <h3>
                  Chỉnh sửa lịch ngày{" "}
                  {dateUtils.convertDateFormat(selectedDate)}
                </h3>

                {/* Hiển thị cảnh báo nếu có appointments */}
                {selectedDateAppointments.length > 0 && (
                  <div className="alert alert-warning">
                    <strong>⚠️ Cảnh báo:</strong> Có{" "}
                    {selectedDateAppointments.length} lịch hẹn đang chờ. Thay
                    đổi lịch có thể ảnh hưởng đến các lịch hẹn này.
                  </div>
                )}

                <div className="form-group">
                  <label>Trạng thái:</label>

                  {/* QUAN TRỌNG: Sửa logic kiểm tra đơn giản */}
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${
                        scheduleForm.is_available ? "active" : ""
                      }`}
                      onClick={() => {
                        console.log("✅ Chuyển sang LÀM VIỆC");
                        setScheduleForm((prev) => ({
                          ...prev,
                          is_available: true,
                          // Nếu chuyển từ nghỉ sang làm việc, khôi phục slots
                          available_slots:
                            prev.available_slots.length === 0
                              ? allTimeSlots
                              : prev.available_slots,
                        }));
                      }}
                    >
                      Làm việc
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${
                        !scheduleForm.is_available ? "active" : ""
                      }`}
                      onClick={() => {
                        console.log("❌ Chuyển sang NGHỈ");
                        setScheduleForm((prev) => ({
                          ...prev,
                          is_available: false,
                          available_slots: [], // Nghỉ = không có slot nào
                        }));
                      }}
                    >
                      Nghỉ
                    </button>
                  </div>
                </div>

                {/* Chỉ hiển thị time slots khi ở chế độ LÀM VIỆC */}
                {scheduleForm.is_available ? (
                  <div className="form-group">
                    <label>
                      Chọn khung giờ làm việc (mặc định tất cả, click để bỏ
                      chọn):
                    </label>

                    {allTimeSlots && allTimeSlots.length > 0 ? (
                      <>
                        <div className="time-slots-grid">
                          {allTimeSlots.map((time, index) => {
                            const hasAppointment =
                              selectedDateAppointments.some(
                                (slot) => slot.time === time
                              );

                            // Logic ĐƠN GIẢN:
                            // - isActive = slot KHÔNG bị admin bỏ chọn
                            // - scheduleForm.available_slots = giờ bị admin bỏ
                            const isActive =
                              scheduleForm.available_slots?.includes(time);

                            return (
                              <button
                                key={index}
                                type="button"
                                className={`time-slot ${
                                  isActive ? "selected" : "inactive"
                                } ${hasAppointment ? "has-appointment" : ""}`}
                                onClick={() => {
                                  if (hasAppointment) {
                                    alert(
                                      `Không thể thay đổi giờ ${time} vì đã có lịch hẹn!`
                                    );
                                    return;
                                  }

                                  setScheduleForm((prev) => {
                                    const currentExcluded =
                                      prev.available_slots || [];

                                    if (currentExcluded.includes(time)) {
                                      // Nếu time đang bị bỏ chọn → cho phép lại
                                      const newExcluded =
                                        currentExcluded.filter(
                                          (t) => t !== time
                                        );
                                      return {
                                        ...prev,
                                        available_slots: newExcluded,
                                      };
                                    } else {
                                      // Nếu time đang active → bỏ chọn
                                      const newExcluded = [
                                        ...currentExcluded,
                                        time,
                                      ].sort();
                                      return {
                                        ...prev,
                                        available_slots: newExcluded,
                                      };
                                    }
                                  });
                                }}
                                title={
                                  hasAppointment
                                    ? `Đã có lịch hẹn (${
                                        selectedDateAppointments.find(
                                          (s) => s.time === time
                                        )?.customer_name
                                      })`
                                    : isActive
                                    ? "Đang làm việc - Nhấn để bỏ chọn (nghỉ giờ này)"
                                    : "Đang nghỉ - Nhấn để chọn lại (làm việc giờ này)"
                                }
                                disabled={hasAppointment}
                              >
                                {time}
                                {hasAppointment && " 📌"}
                                {!isActive && !hasAppointment && " ❌"}
                              </button>
                            );
                          })}
                        </div>

                        {selectedDateAppointments.length > 0 && (
                          <div className="appointment-note">
                            <small>
                              📌 = Đã có lịch hẹn (không thể thay đổi)
                            </small>
                          </div>
                        )}

                        {/* Thông tin hiển thị
                        <div className="selected-slots-info">
                          <p>
                            <strong>Giờ làm việc:</strong>{" "}
                            {scheduleForm.available_slots?.length || 0} /{" "}
                            {allTimeSlots.length} giờ
                            {scheduleForm.available_slots?.length > 0 && (
                              <span className="slots-list">
                                {" "}
                                (Nghỉ: {scheduleForm.available_slots.join(", ")}
                                )
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            className="btn-select-all"
                            onClick={() => {
                              // Làm việc cả ngày = không bỏ slot nào
                              setScheduleForm((prev) => ({
                                ...prev,
                                available_slots: [],
                              }));
                            }}
                          >
                            ✅ Làm việc tất cả
                          </button>
                          <button
                            type="button"
                            className="btn-clear-all"
                            onClick={() => {
                              // Nghỉ cả ngày = bỏ tất cả slot
                              setScheduleForm((prev) => ({
                                ...prev,
                                available_slots: [...allTimeSlots],
                              }));
                            }}
                          >
                            ❌ Nghỉ tất cả
                          </button>
                        </div> */}
                      </>
                    ) : (
                      <div className="alert alert-warning">
                        <strong>⚠️ Không có giờ làm việc mặc định!</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="day-off-notice">
                    <div className="alert alert-info">
                      <strong>📅 Ngày nghỉ:</strong> Không làm việc
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
                        ></span>
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

        {activeTab === "appointments" && (
          <div className="tab-content">
            <div className="appointments-section">
              <h3>Lịch hẹn ({appointments.length})</h3>
              {appointments.map((app) => (
                <div key={app._id} className={`appointment-card ${app.status}`}>
                  <div className="appointment-info">
                    <strong>{app.customer_name}</strong>
                    <span>📞 {app.customer_phone}</span>
                    <span>
                      📅 {app.date} - {app.time}
                    </span>
                    <span>💇 {app.service_type}</span>
                    {app.notes && <span>📝 {app.notes}</span>}
                    {app.staff_id && <span>👨‍💼 {staffNames[app.staff_id]}</span>}
                    <span className="status">Trạng thái: {app.status}</span>
                  </div>
                  <div className="appointment-actions">
                    {app.status === "pending" && (
                      <>
                        <button
                          className="confirm-btn"
                          onClick={() => handleConfirmAppointment(app._id)}
                        >
                          Xác nhận
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => handleCancelAppointment(app._id)}
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteAppointment(app._id)}
                    >
                      Hủy lịch
                    </button>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="no-appointments">Chưa có lịch hẹn nào</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "staff" && (
          <div className="tab-content">
            <div className="staff-management">
              <h3>Quản lý nhân viên</h3>
              {staffLoading && <p className="loading-text">Đang tải...</p>}
              <div className="list-staff">
                {staffList.length === 0 ? (
                  <p>Chưa có nhân viên nào.</p>
                ) : (
                  staffList.map((staff, index) => (
                    <div key={index} className="staff-card">
                      <h4>{staff.name}</h4>
                      <div className="staff-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditStaff(staff)}
                        >
                          Sửa
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteStaff(staff._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <>
                <div className="staff-actions">
                  <button
                    className="add-staff-btn"
                    onClick={() => {
                      setNewStaff({ name: "", _id: null }); // Reset form
                      setShowAddForm(true);
                    }}
                  >
                    Thêm nhân viên mới
                  </button>
                </div>
              </>
            </div>

            {/* Modal thêm nhân viên */}
            {showAddForm && (
              <StaffForm
                staffData={newStaff}
                onSave={handleSaveStaff}
                onClose={handleCloseStaffForm}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
