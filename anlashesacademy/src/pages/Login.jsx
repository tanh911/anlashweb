import { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const Login = ({ setAdmin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE}/auth/register`,
        { username, password },
        { withCredentials: true } // gửi cookie
      );
      if (res.data.success) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsRegistering(false);
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error("Registration failed:", err.response?.data);
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        { username, password }
        // gửi cookie
      );

      if (res.data.success) {
        const token = res.data.token; // JWT from backend
        localStorage.setItem("token", token); // save locally
        setAdmin(res.data.data); // lưu vào state App
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data);
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>{isRegistering ? "Đăng ký Admin" : "Đăng nhập Admin"}</h2>
      <form onSubmit={isRegistering ? handleRegister : handleLogin}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 10,
            padding: 8,
          }}
          autoComplete="username"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 10,
            padding: 8,
          }}
          autoComplete="current-password"
        />
        <button type="submit" style={{ padding: 10, width: "100%" }}>
          {isRegistering ? "Đăng ký" : "Đăng nhập"}
        </button>
      </form>
      <p style={{ marginTop: 10, textAlign: "center" }}>
        {/* {isRegistering ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <button
          style={{
            color: "blue",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Đăng nhập" : "Đăng ký"}
        </button> */}
      </p>
    </div>
  );
};

export default Login;
