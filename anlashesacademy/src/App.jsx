import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  listenToSliderImages,
  listenToAds,
  saveSliderImages,
  saveAds,
} from "./firebase/firestore";
import "./App.css";
import ImageUploader from "./component/ImageUploader";
import Navbar from "./component/header/Navbar";
import Home from "./pages/Home";
import Appointment from "./pages/Appointment";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import PostDetail from "./component/body/PostDetail.jsx";
const API_BASE = import.meta.env.VITE_API_URL;

function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
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

  // Lấy ads từ Firestore (realtime)
  useEffect(() => {
    const unsubscribe = listenToAds((adsData) => {
      setAds(adsData);
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
      console.log("Ảnh đã được xóa thành công");
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      alert("Không thể xóa ảnh: " + error.message);
    }
  };

  // Hàm xóa quảng cáo từ Firestore
  const deleteAd = async (adIndex) => {
    if (!admin) {
      alert("Bạn cần đăng nhập để xóa quảng cáo");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) {
      return;
    }

    try {
      const newAds = ads.filter((_, index) => index !== adIndex);
      await saveAds(newAds);
      console.log("Quảng cáo đã được xóa thành công");
    } catch (error) {
      console.error("Lỗi khi xóa quảng cáo:", error);
      alert("Không thể xóa quảng cáo: " + error.message);
    }
  };

  // Hàm thêm/quản lý ads từ AdminPanel
  const handleAdsUpdate = (newAds) => {
    setAds(newAds);
  };

  // Hàm xử lý khi upload ảnh thành công (cho ads)
  const handleAdUploadSuccess = (imageUrl, adIndex) => {
    const newAds = [...ads];
    newAds[adIndex] = imageUrl;
    setAds(newAds);
    saveAds(newAds); // Lưu ngay lên Firestore
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
      {/* THÊM APP WRAPPER BAO BỌC TOÀN BỘ */}
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

        {/* CONTENT WRAPPER - CHIẾM KHÔNG GIAN CÒN LẠI */}
        <div className="content-wrapper">
          {/* --- Layout 3 cột bao quanh Routes --- */}
          <div className="layout">
            {/* Sidebar trái - Hiển thị ads[0] */}
            <aside className="sidebar">
              <div className="ad-box">
                {ads.length > 0 && ads[0] ? (
                  <div className="ad-content">
                    <img
                      src={ads[0]}
                      alt="Quảng cáo 1"
                      className={`ad-image ${blinkEffect}`}
                    />
                    {loggedIn && (
                      <button
                        className="btn-delete"
                        onClick={() => deleteAd(0)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="ad-placeholder">
                    {loggedIn ? (
                      <ImageUploader
                        loggedIn={loggedIn}
                        onUploadSuccess={(url) => handleAdUploadSuccess(url, 0)}
                        buttonText="Upload ADS 1"
                        uploadType="ad"
                        adIndex={0}
                        existingAds={ads}
                      />
                    ) : (
                      "ADS 1 - 200x250"
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Nội dung chính */}
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
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route
                  path="/login"
                  element={
                    loggedIn ? (
                      <Navigate to="/admin" />
                    ) : (
                      <Login setAdmin={setAdmin} />
                    )
                  }
                />

                <Route
                  path="/admin"
                  element={
                    loggedIn ? (
                      <AdminPanel
                        onDeleteAd={deleteAd}
                        onDeleteImage={deleteSliderImage}
                        sliderImages={sliderImages}
                        ads={ads}
                        onAdsUpdate={handleAdsUpdate}
                      />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              </Routes>
            </main>

            {/* Sidebar phải - Hiển thị ads[1] */}
            <aside className="sidebar">
              <div className="ad-box">
                {ads.length > 1 && ads[1] ? (
                  <div className="ad-content">
                    <img
                      src={ads[1]}
                      alt="Quảng cáo 2"
                      className={`ad-image ${blinkEffect}`}
                    />
                    {loggedIn && (
                      <button
                        className="btn-delete"
                        onClick={() => deleteAd(1)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="ad-placeholder">
                    {loggedIn ? (
                      <ImageUploader
                        loggedIn={loggedIn}
                        onUploadSuccess={(url) => handleAdUploadSuccess(url, 1)}
                        buttonText="Upload ADS 2"
                        uploadType="ad"
                        adIndex={1}
                        existingAds={ads}
                      />
                    ) : (
                      "ADS 2 - 200x250"
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        <footer className="footer">
          <div>© {new Date().getFullYear()} MyAdmin</div>
          <div>Privacy Policy</div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
