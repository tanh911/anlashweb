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
  const [slotDetails, setSlotDetails] = useState({});
  // Form data
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_type: "",
    staff_id: "",
    notes: "",
  });
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // OTP states
  const [otpStep, setOtpStep] = useState("input_phone");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // Sử dụng useRef để lưu trữ reCAPTCHA và container
  const recaptchaVerifierRef = useRef(null);
  const recaptchaContainerIdRef = useRef(null);

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

  // Fetch available staff khi date/time/service thay đổi
  useEffect(() => {
    const fetchAvailableStaff = async () => {
      if (!selectedDate || !selectedTime) {
        setAvailableStaff([]);
        setFormData((prev) => ({ ...prev, staff_id: "" }));
        return;
      }

      setStaffLoading(true);
      try {
        const params = {
          date: selectedDate.toLocaleDateString("sv-SE"),
          time: selectedTime,
        };

        if (formData.service_type) {
          params.service_type = formData.service_type;
        }

        const response = await axios.get(
          `${API_BASE}/appointments/available-staff`,
          {
            params,
          }
        );
        if (response.data.success) {
          console.log("hello");
          const staffData = response.data.data;
          setAvailableStaff(staffData);

          // Tự động chọn nhân viên được đề xuất (có ít appointment nhất)
          if (staffData.length > 0) {
            const recommendedStaff = staffData[0];
            setFormData((prev) => ({
              ...prev,
              staff_id: recommendedStaff.id,
            }));
          } else {
            setFormData((prev) => ({ ...prev, staff_id: "" }));
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy nhân viên:", error);
        setAvailableStaff([]);
        setFormData((prev) => ({ ...prev, staff_id: "" }));
      } finally {
        setStaffLoading(false);
      }
    };

    if (selectedDate && selectedTime) {
      fetchAvailableStaff();
    }
  }, [selectedDate, selectedTime, formData.service_type]);

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

  // Khởi tạo reCAPTCHA
  const initializeRecaptcha = () => {
    try {
      // Xóa reCAPTCHA cũ nếu tồn tại
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.log("⚠️ Error clearing old reCAPTCHA:", error);
        }
        recaptchaVerifierRef.current = null;
      }

      // Tạo container ID duy nhất
      recaptchaContainerIdRef.current = `recaptcha-container-${Date.now()}`;

      // Xóa container cũ nếu có
      const oldContainer = document.getElementById(
        recaptchaContainerIdRef.current
      );
      if (oldContainer) {
        oldContainer.remove();
      }

      // Tạo container mới
      const container = document.createElement("div");
      container.id = recaptchaContainerIdRef.current;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.overflow = "hidden";
      document.body.appendChild(container);

      // Kiểm tra auth
      if (!auth) {
        console.error("❌ Auth instance is undefined!");
        return;
      }

      // Tạo reCAPTCHA mới với cấu trúc đúng
      // Lưu ý: Tham số thứ nhất là containerId (string), thứ hai là options, thứ ba là auth
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth, // auth là tham số thứ ba
        recaptchaContainerIdRef.current, // containerId là string
        {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            console.log("⚠️ reCAPTCHA expired");
            recaptchaVerifierRef.current = null;
          },
        }
      );
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
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.error("Error clearing reCAPTCHA:", error);
        }
        recaptchaVerifierRef.current = null;
      }

      // Xóa container
      if (recaptchaContainerIdRef.current) {
        const container = document.getElementById(
          recaptchaContainerIdRef.current
        );
        if (container) {
          try {
            container.remove();
          } catch (error) {
            console.log("⚠️ Error removing container:", error);
          }
        }
        recaptchaContainerIdRef.current = null;
      }
    };
  }, []);
  const fetchDailySlots = async (date) => {
    try {
      const dateString = date.toLocaleDateString("sv-SE");
      const response = await axios.get(
        `${API_BASE}/schedule/available/date/${dateString}`
      );

      if (response.data.success) {
        const data = response.data.data;

        // Lưu slot details nếu có
        if (data.slot_details) {
          setSlotDetails((prev) => ({
            ...prev,
            [dateString]: data.slot_details,
          }));
        }

        // DỰA VÀO SLOT DETAILS ĐỂ TÍNH FREE SLOTS
        let freeSlots = [];
        if (data.slot_details) {
          // Chỉ lấy các slot còn nhân viên trống
          freeSlots = data.slot_details
            .filter((slot) => slot.is_available)
            .map((slot) => slot.time);
        } else {
          // Fallback: dùng logic cũ
          freeSlots = data.freeSlots || [];
        }

        return {
          freeSlots: freeSlots,
          totalStaff: data.total_staff || 0,
          slotDetails: data.slot_details || [],
        };
      }
      return { freeSlots: [] };
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

    // Kiểm tra số điện thoại có ít nhất 9 số
    const phoneDigits = formData.customer_phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      setOtpMessage("⚠️ Số điện thoại không hợp lệ");
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");

    try {
      // Chuẩn hóa số điện thoại
      let phoneNumber = formData.customer_phone.replace(/\s+/g, "");

      // Nếu không bắt đầu bằng +, thêm +84
      if (!phoneNumber.startsWith("+")) {
        // Loại bỏ số 0 đầu tiên nếu có
        if (phoneNumber.startsWith("0")) {
          phoneNumber = phoneNumber.substring(1);
        }
        phoneNumber = `+84${phoneNumber}`;
      }

      // Kiểm tra và khởi tạo lại reCAPTCHA nếu cần
      if (!recaptchaVerifierRef.current) {
        initializeRecaptcha();

        // Đợi để đảm bảo reCAPTCHA đã sẵn sàng
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error("Không thể khởi tạo reCAPTCHA");
      }

      // Gửi OTP
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
      setOtpStep("verify_otp");
      setOtpMessage(`✅ Đã gửi OTP đến ${formData.customer_phone}`);
    } catch (error) {
      console.error("❌ Lỗi gửi OTP:", error);
      console.error("Error details:", error.code, error.message);

      // Xử lý lỗi cụ thể
      if (error.code === "auth/invalid-phone-number") {
        setOtpMessage("❌ Số điện thoại không hợp lệ");
      } else if (error.code === "auth/quota-exceeded") {
        setOtpMessage("❌ Đã vượt quá số lần gửi OTP. Vui lòng thử lại sau");
      } else if (error.code === "auth/too-many-requests") {
        setOtpMessage("❌ Quá nhiều yêu cầu. Vui lòng thử lại sau");
      } else if (error.code === "auth/captcha-check-failed") {
        setOtpMessage("❌ Lỗi xác thực reCAPTCHA. Vui lòng thử lại");
        // Reset hoàn toàn reCAPTCHA
        initializeRecaptcha();
      } else if (
        error.message.includes("reCAPTCHA") ||
        error.message.includes("already rendered")
      ) {
        setOtpMessage("❌ Lỗi reCAPTCHA. Vui lòng thử lại");
        // Reset reCAPTCHA
        initializeRecaptcha();
      } else {
        setOtpMessage(`❌ Lỗi: ${error.message || "Không xác định"}`);
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
      setOtpStep("verified");
      setVerifiedPhone(formData.customer_phone);

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

  // Sửa hàm isAdminFree
  const isAdminFree = (date, time) => {
    if (!date) return false;

    const dateString = date.toLocaleDateString("sv-SE");
    const slots = availableSlots[dateString];

    if (!slots) return false;

    // Kiểm tra slot có trong danh sách available không
    return slots.includes(time);
  };

  // Sửa hàm fetchAvailableSlots
  const fetchAvailableSlots = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const response = await axios.get(
        `${API_BASE}/schedule/available/${year}/${month}`
      );

      if (response.data.success) {
        const slotsData = response.data.data || {};

        const convertedSlots = {};
        Object.keys(slotsData).forEach((date) => {
          if (Array.isArray(slotsData[date])) {
            convertedSlots[date] = slotsData[date];
          } else if (slotsData[date] && slotsData[date].available_slots) {
            convertedSlots[date] = slotsData[date].available_slots;
          } else {
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

  // Sửa hàm handleDateClick
  const handleDateClick = async (date) => {
    if (!date || date < new Date().setHours(0, 0, 0, 0)) return;

    setSelectedDate(date);
    setSelectedTime("");
    setView("calendar");
    setFormData((prev) => ({ ...prev, staff_id: "" }));

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
  const getSlotInfo = (date, time) => {
    if (!date || !time) return null;

    const dateString = date.toLocaleDateString("sv-SE");
    const slots = slotDetails[dateString];

    if (!slots) return null;

    return slots.find((slot) => slot.time === time);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "customer_phone") {
      handlePhoneChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Nếu đổi service type, reset staff selection
      if (name === "service_type") {
        setFormData((prev) => ({ ...prev, staff_id: "" }));
      }
    }
  };

  // Fetch available staff
  // const fetchAvailableStaff = async () => {
  //   if (!selectedDate || !selectedTime) {
  //     setAvailableStaff([]);
  //     setFormData((prev) => ({ ...prev, staff_id: "" }));
  //     return;
  //   }

  //   setStaffLoading(true);
  //   try {
  //     const params = {
  //       date: selectedDate.toLocaleDateString("sv-SE"),
  //       time: selectedTime,
  //     };

  //     if (formData.service_type) {
  //       params.service_type = formData.service_type;
  //     }

  //     const response = await axios.get(`${API_BASE}/staff/available`, {
  //       params,
  //     });

  //     if (response.data.success) {
  //       const staffData = response.data.data;
  //       setAvailableStaff(staffData);

  //       // Tự động chọn nhân viên được đề xuất (có ít appointment nhất)
  //       if (staffData.length > 0 && !formData.staff_id) {
  //         const recommendedStaff = staffData[0];
  //         setFormData((prev) => ({
  //           ...prev,
  //           staff_id: recommendedStaff.id,
  //         }));
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Lỗi khi lấy nhân viên:", error);
  //     setAvailableStaff([]);
  //     setFormData((prev) => ({ ...prev, staff_id: "" }));
  //   } finally {
  //     setStaffLoading(false);
  //   }
  // };

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

    if (!formData.staff_id) {
      alert("Vui lòng chọn nhân viên");
      return;
    }

    if (otpStep !== "verified") {
      alert("⚠️ Vui lòng xác thực số điện thoại bằng OTP trước khi đặt lịch");
      return;
    }

    setLoading(true);
    try {
      const dateString = selectedDate.toLocaleDateString("sv-SE");
      let staffIdToSend = formData.staff_id;
      if (
        staffIdToSend &&
        typeof staffIdToSend === "object" &&
        staffIdToSend._bsontype === "ObjectId"
      ) {
        staffIdToSend = staffIdToSend.toString();
        console.log("🔄 Converted ObjectId instance to string:", staffIdToSend);
      }
      const response = await axios.post(`${API_BASE}/appointments`, {
        date: dateString,
        time: selectedTime,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || "",
        service_type: formData.service_type,
        notes: formData.notes || "",
        staff_id: staffIdToSend || null, // Gửi null nếu không có
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
          staff_id: "",
          notes: "",
        });
        setSelectedDate(null);
        setSelectedTime("");
        setView("calendar");
        setAvailableStaff([]);
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

  // const getSelectedStaff = () => {
  //   return availableStaff.find((staff) => staff.id === formData.staff_id);
  // };

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
                  const slotInfo = getSlotInfo(selectedDate, time);

                  return (
                    <button
                      key={time}
                      className={`time-slot ${
                        isFree ? "available" : "unavailable"
                      } ${selectedTime === time ? "selected" : ""}`}
                      onClick={() => handleTimeClick(time)}
                      disabled={!isFree}
                      title={
                        slotInfo
                          ? `Còn ${slotInfo.available_staff_count}/${slotInfo.total_staff} nhân viên trống`
                          : "Không có thông tin"
                      }
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
                      minLength={9}
                      maxLength={11}
                    />

                    {otpStep === "input_phone" && (
                      <button
                        type="button"
                        className="btn-send-otp"
                        onClick={sendOtp}
                        disabled={
                          otpLoading || formData.customer_phone.length < 9
                        }
                      >
                        {otpLoading ? (
                          <>
                            <span className="spinner"></span> Đang gửi...
                          </>
                        ) : (
                          "Gửi OTP"
                        )}
                      </button>
                    )}

                    {otpStep === "verify_otp" && (
                      <div className="otp-verification">
                        <div className="otp-input-group">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value.replace(/\D/g, "").slice(0, 6)
                              )
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
                            {otpLoading ? (
                              <>
                                <span className="spinner"></span> Đang xác
                                thực...
                              </>
                            ) : (
                              "✅ Xác thực"
                            )}
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
                        otpMessage.includes("✅") ||
                        otpMessage.includes("Đã gửi")
                          ? "success"
                          : "error"
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

                {/* Staff Selection */}
                <div className="form-group">
                  <label>Nhân Viên *</label>
                  {staffLoading ? (
                    <div className="loading-staff">
                      Đang tải danh sách nhân viên...
                    </div>
                  ) : availableStaff.length === 0 ? (
                    <div className="no-staff">
                      Không có nhân viên trống trong khung giờ này
                    </div>
                  ) : (
                    <div className="staff-selection-wrapper">
                      <select
                        name="staff_id"
                        value={formData.staff_id}
                        onChange={handleInputChange}
                        required
                        className="staff-select"
                      >
                        <option value="">-- Chọn nhân viên --</option>
                        {availableStaff.map((staff) => {
                          // Đảm bảo staff_id là string
                          const staffId = staff._id
                            ? staff._id.toString()
                            : staff.id;
                          const staffKey = staffId || `staff-${Math.random()}`;

                          return (
                            <option key={staffKey} value={staffId}>
                              {staff.name}
                              {staff.rating > 0 &&
                                ` ★ ${staff.rating.toFixed(1)}`}
                              {staff.specialties &&
                                staff.specialties.length > 0 &&
                                ` (${staff.specialties
                                  .slice(0, 2)
                                  .join(", ")})`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
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
                    disabled={
                      loading || otpStep !== "verified" || !formData.staff_id
                    }
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

      {/* Không cần container tĩnh, container được tạo động */}
    </div>
  );
};

export default Appointment;
