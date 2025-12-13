import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { listenToSliderImages, saveSliderImages } from "./firebase/firestore";
import "./App.css";
import Navbar from "./component/header/Navbar";
import Home from "./pages/Home";
import Appointment from "./pages/Appointment";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import PostDetail from "./component/body/PostDetail.jsx";
import { DebugSlider } from "./component/DebugSlider.jsx";
const API_BASE = import.meta.env.VITE_API_URL;

function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sliderImages, setSliderImages] = useState([]);
  const [blinkEffect, setBlinkEffect] = useState("blink-pulse");

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) setAdmin(res.data.data);
        else setAdmin(null);
      } catch (error) {
        console.error("Session check failed:", error);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Lấy slider images từ Firestore (realtime)
  useEffect(() => {
    const unsubscribe = listenToSliderImages((images) => {
      setSliderImages(images);
    });
    return unsubscribe;
  }, []);

  // Hàm xóa ảnh slider từ Firestore
  const deleteSliderImage = async (imageIndex) => {
    if (!admin) {
      alert("Bạn cần đăng nhập để xóa ảnh");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) {
      return;
    }

    try {
      const newSliderImages = sliderImages.filter(
        (_, index) => index !== imageIndex
      );
      await saveSliderImages(newSliderImages);
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      alert("Không thể xóa ảnh: " + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAdmin(null);
  };

  // Hàm thay đổi hiệu ứng nhấp nháy
  const changeBlinkEffect = (effect) => {
    setBlinkEffect(effect);
  };

  if (loading) return <div>Loading...</div>;

  const loggedIn = !!admin;

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar loggedIn={loggedIn} onLogout={handleLogout} />

        {/* Nút chọn hiệu ứng cho admin */}
        {loggedIn && (
          <div
            className="effect-controls"
            style={{
              position: "fixed",
              top: "80px",
              right: "20px",
              zIndex: 1000,
              background: "white",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <label>Hiệu ứng: </label>
            <select
              value={blinkEffect}
              onChange={(e) => changeBlinkEffect(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="blink-pulse">Pulse</option>
              <option value="blink">Nhấp nháy đơn giản</option>
              <option value="blink-fast">Nhấp nháy nhanh</option>
              <option value="blink-slow">Nhấp nháy chậm</option>
              <option value="blink-strong">Nhấp nháy mạnh</option>
              <option value="blink-with-bg">Nền gradient</option>
              <option value="blink-border">Border flash</option>
            </select>
          </div>
        )}

        <div className="content-wrapper">
          <div className="layout">
            <main className="main-content">
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home
                      loggedIn={loggedIn}
                      sliderImages={sliderImages}
                      onDeleteImage={deleteSliderImage}
                    />
                  }
                />
                <Route path="/appointment" element={<Appointment />} />
                <Route
                  path="/gallery"
                  element={<Gallery loggedIn={loggedIn} />}
                />
                <Route path="/about" element={<About loggedIn={loggedIn} />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/post/:id" element={<PostDetail />} />
                {/* SỬA 2 ROUTE NÀY: */}
                <Route
                  path="/login"
                  element={
                    loggedIn ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <Login setAdmin={setAdmin} />
                    )
                  }
                />
                <Route
                  path="/admin"
                  element={
                    loggedIn ? <AdminPanel /> : <Navigate to="/login" replace />
                  }
                />
                {/* Có thể thêm route catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        {/* <DebugSlider /> */}
        <footer className="footer">
          <div>© {new Date().getFullYear()} MyAdmin</div>
          <div>Privacy Policy</div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
