import { useState } from "react";
import axios from "axios";
import "./Login.css";

const API_BASE = "https://anlashwebbe.onrender.com/api";

const Login = ({ setAdmin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE}/auth/register`,
        { username, password },
        { withCredentials: true }
      );
      if (res.data.success) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsRegistering(false);
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error("Registration failed:", err.response?.data);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username,
        password,
      });

      if (res.data.success) {
        const token = res.data.token;
        localStorage.setItem("token", token);
        setAdmin(res.data.data);
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2 className="login-title">
          {isRegistering ? "Đăng ký Admin" : "Đăng nhập Admin"}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form
          className="login-form"
          onSubmit={isRegistering ? handleRegister : handleLogin}
        >
          <div className="input-group">
            <input
              className="login-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <span className="input-icon">👤</span>
          </div>

          <div className="input-group">
            <input
              className="login-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <span className="input-icon">🔒</span>
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "" : isRegistering ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
