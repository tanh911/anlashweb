import React, { useState, useEffect } from "react";
import axios from "axios";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  connectAuthEmulator,
} from "firebase/auth";
import "./Appointment.css";

const API_BASE = import.meta.env.VITE_API_URL;

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCNw813rVFbhq3QOTUGLn2WDguk38TujUk",
  authDomain: "myfirstproject-bc7c4.firebaseapp.com",
  projectId: "myfirstproject-bc7c4",
  storageBucket: "myfirstproject-bc7c4.firebasestorage.app",
  messagingSenderId: "859310752603",
  appId: "1:859310752603:web:c9113dc6a4c1efa528907e",
  measurementId: "G-EPG92C0ED1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to emulator
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  connectAuthEmulator(auth, "http://localhost:9099");
  console.log("✅ Firebase Auth Emulator connected");
}

const Appointment = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("calendar");

  // Form data
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_type: "",
    notes: "",
  });
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  // OTP states
  const [otpStep, setOtpStep] = useState("input_phone");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verifiedPhone, setVerifiedPhone] = useState("");

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

  useEffect(() => {
    fetchServices();
  }, []);
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const response = await axios.get(`${API_BASE}/services`);
      if (response.data.success) {
        setServices(response.data.data);
        // Set default service là dịch vụ đầu tiên
        if (response.data.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            service_type: response.data.data[0].name,
          }));
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", error);
      // Fallback services nếu API lỗi
      setServices([
        {
          name: "Haircut",
          description: "Cắt tóc",
          duration: 60,
          price: 100000,
        },
        {
          name: "Hair Color",
          description: "Nhuộm tóc",
          duration: 120,
          price: 300000,
        },
        {
          name: "Hair Treatment",
          description: "Ủ tóc",
          duration: 90,
          price: 200000,
        },
        {
          name: "Styling",
          description: "Tạo kiểu",
          duration: 45,
          price: 150000,
        },
      ]);
    } finally {
      setServicesLoading(false);
    }
  };
  // Khởi tạo reCAPTCHA
  useEffect(() => {
    initializeRecaptcha();
  }, []);

  useEffect(() => {
    fetchAvailableSlots();
  }, [currentDate]);

  const initializeRecaptcha = () => {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
        }
      );
      console.log("reCAPTCHA initialized");
    } catch (error) {
      console.log("reCAPTCHA init:", error.message);
    }
  };

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
      return response.data.success ? response.data.data : { freeSlots: [] };
    } catch (error) {
      console.error("Lỗi khi lấy lịch theo ngày:", error);
      return { freeSlots: [] };
    }
  };

  // Gửi OTP
  const sendOtp = async () => {
    if (!formData.customer_phone) {
      setOtpMessage("⚠️ Vui lòng nhập số điện thoại");
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");

    try {
      const phoneNumber = formData.customer_phone.startsWith("+")
        ? formData.customer_phone
        : `+84${formData.customer_phone.replace(/^0+/, "")}`;

      console.log("📤 Gửi OTP đến:", phoneNumber);

      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setOtpStep("verify_otp");
      setOtpMessage(`✅ Đã gửi OTP đến ${phoneNumber}. Mã OTP: 123456`);
    } catch (error) {
      console.error("❌ Lỗi gửi OTP:", error);
      setOtpMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  // Xác thực OTP
  const verifyOtp = async () => {
    if (!otp) {
      setOtpMessage("⚠️ Vui lòng nhập mã OTP");
      return;
    }

    setOtpLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setOtpStep("verified");
      setVerifiedPhone(formData.customer_phone);
      setOtpMessage("✅ Số điện thoại đã được xác thực!");
    } catch (error) {
      setOtpMessage("❌ Mã OTP không đúng. Vui lòng thử lại.", error);
    } finally {
      setOtpLoading(false);
    }
  };

  // Reset OTP
  const resetOtpVerification = () => {
    setOtpStep("input_phone");
    setOtp("");
    setOtpMessage("");
    setConfirmationResult(null);
    setVerifiedPhone("");
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customer_phone: value }));
    if (verifiedPhone && verifiedPhone !== value) resetOtpVerification();
  };

  const isAdminFree = (date, time) => {
    const dateString = date.toISOString().split("T")[0];
    return availableSlots[dateString]?.includes(time) || false;
  };

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

  const handleDateClick = async (date) => {
    if (!date || date < new Date().setHours(0, 0, 0, 0)) return;
    setSelectedDate(date);
    setSelectedTime("");
    setView("calendar");

    const dailyData = await fetchDailySlots(date);
    const dateString = date.toISOString().split("T")[0];
    setAvailableSlots((prev) => ({
      ...prev,
      [dateString]: dailyData.freeSlots,
    }));
  };

  const handleTimeClick = (time) => {
    if (!selectedDate) return;
    const isFree = isAdminFree(selectedDate, time);
    if (isFree) {
      setSelectedTime(time);
      setView("form");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "customer_phone") {
      handlePhoneChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

    if (otpStep !== "verified") {
      alert("⚠️ Vui lòng xác thực số điện thoại bằng OTP trước khi đặt lịch");
      return;
    }

    setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split("T")[0];
      const response = await axios.post(`${API_BASE}/appointments`, {
        date: dateString,
        time: selectedTime,
        ...formData,
        phone_verified: true,
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
        resetOtpVerification();
        fetchAvailableSlots();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Có lỗi xảy ra! Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
  const getSelectedService = () => {
    return services.find((service) => service.name === formData.service_type);
  };
  return (
    <div className="appointment-container">
      <div className="appointment-header">
        <h1>Đặt Lịch Hẹn</h1>
      </div>

      <div className="appointment-content">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar">
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
            <div className="calendar-weekdays">
              {dayNames.map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-days">
              {days.map((day, index) => {
                if (!day)
                  return <div key={index} className="calendar-day empty"></div>;

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
                      {time} {isFree ? " ✅" : " ❌"}
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
                  <div className="phone-verification">
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handlePhoneChange}
                      required
                      placeholder="Nhập số điện thoại"
                      disabled={otpStep === "verified"}
                    />

                    {otpStep === "input_phone" && (
                      <button
                        type="button"
                        className="btn-send-otp"
                        onClick={sendOtp}
                        disabled={otpLoading || !formData.customer_phone}
                      >
                        {otpLoading ? "⏳" : "📤"} Xác nhận số điện thoại
                      </button>
                    )}

                    {otpStep === "verify_otp" && (
                      <div className="otp-verification">
                        <div className="otp-input-group">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) =>
                              setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="Nhập mã OTP"
                            maxLength={6}
                            className="otp-input"
                          />
                          <button
                            type="button"
                            className="btn-verify-otp"
                            onClick={verifyOtp}
                            disabled={otpLoading || otp.length !== 6}
                          >
                            {otpLoading ? "⏳" : "✅"} Xác thực
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn-resend-otp"
                          onClick={sendOtp}
                          disabled={otpLoading}
                        >
                          🔄 Gửi lại OTP
                        </button>
                      </div>
                    )}

                    {otpStep === "verified" && (
                      <div className="verified-phone">
                        <span className="verified-badge">✅ Đã xác thực</span>
                        <button
                          type="button"
                          className="btn-change-phone"
                          onClick={resetOtpVerification}
                        >
                          🔄 Đổi số
                        </button>
                      </div>
                    )}
                  </div>

                  {otpMessage && (
                    <div
                      className={`otp-message ${
                        otpMessage.includes("✅") ? "success" : "error"
                      }`}
                    >
                      {otpMessage}
                    </div>
                  )}
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
                  <label>Dịch vụ *</label>
                  {servicesLoading ? (
                    <div className="loading-services">
                      Đang tải danh sách dịch vụ...
                    </div>
                  ) : (
                    <>
                      <select
                        name="service_type"
                        value={formData.service_type}
                        onChange={handleInputChange}
                        required
                        className="service-select"
                      >
                        {services
                          .filter((service) => service.isActive !== false)
                          .map((service) => (
                            <option
                              key={service._id || service.name}
                              value={service.name}
                            >
                              {service.name}
                              {service.price > 0 &&
                                ` - ${service.price.toLocaleString("vi-VN")}đ`}
                              {service.duration &&
                                ` (${service.duration} phút)`}
                            </option>
                          ))}
                      </select>

                      {/* Hiển thị thông tin chi tiết dịch vụ */}
                      {getSelectedService() && (
                        <div className="service-details">
                          <p className="service-description">
                            {getSelectedService().description}
                          </p>
                          <div className="service-meta">
                            {getSelectedService().duration && (
                              <span className="service-duration">
                                ⏱ {getSelectedService().duration} phút
                              </span>
                            )}
                            {getSelectedService().price > 0 && (
                              <span className="service-price">
                                💰{" "}
                                {getSelectedService().price.toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                    disabled={loading || otpStep !== "verified"}
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

      {/* reCAPTCHA container - ẨN */}
      <div id="recaptcha-container" style={{ display: "none" }}></div>
    </div>
  );
};

export default Appointment;
