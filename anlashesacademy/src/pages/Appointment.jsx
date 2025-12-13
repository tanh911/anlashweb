import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/config";

import "./Appointment.css";

const API_BASE = import.meta.env.VITE_API_URL;

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

  // Sử dụng useRef để lưu trữ reCAPTCHA
  const recaptchaVerifierRef = useRef(null);
  //const recaptchaContainerRef = useRef(null);

  const workingHours = [
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

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const response = await axios.get(`${API_BASE}/services`);
      if (response.data.success) {
        setServices(response.data.data);
        if (response.data.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            service_type: response.data.data[0].name,
          }));
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", error);
    } finally {
      setServicesLoading(false);
    }
  };

  // Khởi tạo reCAPTCHA - chỉ một lần
  const initializeRecaptcha = () => {
    try {
      // Xóa reCAPTCHA cũ nếu tồn tại
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      // Kiểm tra auth
      if (!auth) {
        console.error("❌ Auth instance is undefined!");
        return;
      }

      console.log("🔄 Initializing reCAPTCHA...");

      // Tạo reCAPTCHA mới
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("✅ reCAPTCHA callback received:", response);
          },
          "expired-callback": () => {
            console.log("⚠️ reCAPTCHA expired");
            // Reset khi expired
            recaptchaVerifierRef.current = null;
          },
          "error-callback": (error) => {
            console.log("❌ reCAPTCHA error:", error);
            recaptchaVerifierRef.current = null;
          },
        }
      );

      // Render widget
      recaptchaVerifierRef.current
        .render()
        .then((widgetId) => {
          console.log("✅ reCAPTCHA widget rendered with ID:", widgetId);
        })
        .catch((error) => {
          console.error("❌ Failed to render reCAPTCHA:", error);
        });
    } catch (error) {
      console.error("❌ Error initializing reCAPTCHA:", error);
      recaptchaVerifierRef.current = null;
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
  }, [currentDate]);

  useEffect(() => {
    // Khởi tạo reCAPTCHA khi component mount
    initializeRecaptcha();

    // Cleanup khi component unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        console.log("🧹 Cleaning up reCAPTCHA");
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const fetchDailySlots = async (date) => {
    try {
      const dateString = date.toLocaleDateString("sv-SE");
      const response = await axios.get(
        `${API_BASE}/schedule/available/date/${dateString}`
      );
      return response.data.success ? response.data.data : { freeSlots: [] };
    } catch (error) {
      console.error("Lỗi khi lấy lịch theo ngày:", error);
      return { freeSlots: [] };
    }
  };

  const sendOtp = async () => {
    if (!formData.customer_phone) {
      setOtpMessage("⚠️ Vui lòng nhập số điện thoại");
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");

    try {
      // Chuẩn hóa số điện thoại
      const phoneNumber = formData.customer_phone.startsWith("+")
        ? formData.customer_phone.replace(/\s+/g, "")
        : `+84${formData.customer_phone
            .replace(/^0+/, "")
            .replace(/\s+/g, "")}`;

      console.log("📞 Sending OTP to:", phoneNumber);

      // Kiểm tra và khởi tạo lại reCAPTCHA nếu cần
      if (!recaptchaVerifierRef.current) {
        console.log("🔄 Re-initializing reCAPTCHA...");
        initializeRecaptcha();

        // Đợi một chút để reCAPTCHA render
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error("Không thể khởi tạo reCAPTCHA");
      }

      console.log("✅ Using reCAPTCHA verifier:", recaptchaVerifierRef.current);

      // Gửi OTP
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifierRef.current
      );

      console.log("✅ OTP sent successfully:", result);

      setConfirmationResult(result);
      setOtpStep("verify_otp");
      setOtpMessage(`✅ Đã gửi OTP đến ${formData.customer_phone}`);
    } catch (error) {
      console.error("❌ Lỗi gửi OTP:", error);

      // Xử lý lỗi cụ thể
      if (error.code === "auth/invalid-phone-number") {
        setOtpMessage("❌ Số điện thoại không hợp lệ");
      } else if (error.code === "auth/quota-exceeded") {
        setOtpMessage("❌ Đã vượt quá số lần gửi OTP. Vui lòng thử lại sau");
      } else if (error.message.includes("reCAPTCHA")) {
        setOtpMessage("❌ Lỗi xác thực. Vui lòng thử lại");
        // Reset reCAPTCHA
        recaptchaVerifierRef.current = null;
      } else {
        setOtpMessage(`❌ Lỗi: ${error.message}`);
      }
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

    if (!confirmationResult) {
      setOtpMessage(
        "❌ Không tìm thấy thông tin xác thực. Vui lòng gửi lại OTP"
      );
      return;
    }

    setOtpLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setOtpStep("verified");
      setVerifiedPhone(formData.customer_phone);
      setOtpMessage("✅ Số điện thoại đã được xác thực!");

      // Xóa reCAPTCHA sau khi xác thực thành công
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } catch (error) {
      console.error("❌ Lỗi xác thực OTP:", error);
      if (error.code === "auth/invalid-verification-code") {
        setOtpMessage("❌ Mã OTP không đúng. Vui lòng thử lại");
      } else if (error.code === "auth/code-expired") {
        setOtpMessage("❌ Mã OTP đã hết hạn. Vui lòng gửi lại");
        setOtpStep("input_phone");
      } else {
        setOtpMessage(`❌ Lỗi: ${error.message}`);
      }
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

    // Khởi tạo lại reCAPTCHA
    initializeRecaptcha();
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Chỉ cho phép nhập số
    const numericValue = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, customer_phone: numericValue }));

    if (verifiedPhone && verifiedPhone !== numericValue) {
      resetOtpVerification();
    }
  };

  // Appointment.jsx - Sửa hàm isAdminFree
  const isAdminFree = (date, time) => {
    const dateString = date.toLocaleDateString("sv-SE");
    const dateString2 = date.toISOString().split("T")[0]; // Format YYYY-MM-DD

    // Kiểm tra cả 2 formats nếu cần
    const slots = availableSlots[dateString] || availableSlots[dateString2];

    if (!slots) return false;

    // slots có thể là array hoặc object
    if (Array.isArray(slots)) {
      return slots.includes(time);
    } else if (slots.available_slots) {
      // Nếu là schedule object
      return slots.available_slots.includes(time);
    }

    return false;
  };

  // Sửa hàm fetchAvailableSlots
  const fetchAvailableSlots = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const response = await axios.get(
        `${API_BASE}/schedule/available/${year}/${month}`
      );

      console.log("📅 Available slots response:", response.data);

      if (response.data.success) {
        // API trả về object với key là date string
        const slotsData = response.data.data || {};
        console.log(
          "📅 Available slots data:",
          Object.keys(slotsData).length,
          "days"
        );

        // Chuyển đổi nếu cần
        const convertedSlots = {};
        Object.keys(slotsData).forEach((date) => {
          // Nếu là array, giữ nguyên
          if (Array.isArray(slotsData[date])) {
            convertedSlots[date] = slotsData[date];
          }
          // Nếu là schedule object, lấy available_slots
          else if (slotsData[date] && slotsData[date].available_slots) {
            convertedSlots[date] = slotsData[date].available_slots;
          }
          // Ngày nghỉ
          else {
            convertedSlots[date] = [];
          }
        });

        setAvailableSlots(convertedSlots);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch rảnh:", error);
      setAvailableSlots({});
    }
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
    const dateString = date.toLocaleDateString("sv-SE");
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
      const dateString = selectedDate.toLocaleDateString("sv-SE");
      const response = await axios.post(`${API_BASE}/appointments`, {
        date: dateString,
        time: selectedTime,
        ...formData,
        phone_verified: true,
      });

      if (response.data.success) {
        alert("✅ Đặt lịch thành công!");
        // Reset form
        setFormData({
          customer_name: "",
          customer_phone: "",
          customer_email: "",
          service_type: services.length > 0 ? services[0].name : "",
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
                  <p>⚠️ Không có lịch trống</p>
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
                        {otpLoading ? "⏳" : "📤"} Gửi OTP
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

      {/* reCAPTCHA container - ẨN nhưng vẫn trong DOM */}
      <div
        id="recaptcha-container"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      ></div>
    </div>
  );
};

export default Appointment;
