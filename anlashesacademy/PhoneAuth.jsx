import React, { useState } from "react";
import { auth, setUpRecaptcha } from "./firebase";
import { signInWithPhoneNumber } from "firebase/auth";

export default function PhoneAuth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    try {
      const verifier = setUpRecaptcha("recaptcha-container");
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      setResult(confirmation);
      setMessage("OTP đã gửi (test mode). Nhập mã test để xác nhận.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const verifyOtp = async () => {
    try {
      await result.confirm(otp);
      setMessage("✅ Xác thực thành công!");
    } catch (error) {
      setMessage("❌ OTP sai hoặc hết hạn");
    }
  };

  return (
    <div>
      <h2>Test OTP Firebase</h2>
      {!result ? (
        <>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+84123456789"
          />
          <button onClick={sendOtp}>Gửi OTP</button>
        </>
      ) : (
        <>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập OTP test (vd: 123456)"
          />
          <button onClick={verifyOtp}>Xác nhận</button>
        </>
      )}
      <div id="recaptcha-container"></div>
      {message && <p>{message}</p>}
    </div>
  );
}
