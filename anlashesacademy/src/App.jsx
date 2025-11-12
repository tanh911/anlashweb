import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

import Navbar from "./component/header/Navbar";
import Home from "./pages/Home";
import Appointment from "./pages/Appointment";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import Footer from "./component/footer/Footer";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [admin, setAdmin] = useState(null); // lưu info admin hoặc null
  const [loading, setLoading] = useState(true);
  // Kiểm tra session khi load app
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

  // Logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem("token"); // ← XÓA TOKEN
      setAdmin(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  const loggedIn = !!admin;

  return (
    <Router>
      <Navbar loggedIn={loggedIn} onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={<Home loggedIn={loggedIn} />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          {/* <Route path="/contact" element={<Contact />} /> */}

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
            element={loggedIn ? <AdminPanel /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>
      <footer>
        <Footer />
      </footer>
    </Router>
  );
}

export default App;
