import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ loggedIn, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header">
      <nav className="navbar">
        <div className="nav-container">
          {/* Nửa trái: Logo + Menu */}
          <div className="nav-left">
            <div className="logo-container">
              <img src="/logo1.jpg" alt="Logo" />
              <Link
                to="/"
                className="nav-logo"
                onClick={closeMenu}
                style={{
                  color: "#6b7280",
                  fontFamily: "'Kavoon', serif",
                  letterSpacing: "0.5px",
                  opacity: 0.9,
                }}
              >
                Anlashes Academy
              </Link>
            </div>

            {/* Menu */}
            <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
              <li className="nav-item">
                <Link
                  to="/"
                  className="nav-link"
                  onClick={closeMenu}
                  style={{ fontSize: "18px" }}
                >
                  Trang Chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/appointment"
                  className="nav-link"
                  onClick={closeMenu}
                  style={{ fontSize: "18px" }}
                >
                  Đặt Lịch
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/gallery"
                  className="nav-link"
                  onClick={closeMenu}
                  style={{ fontSize: "18px" }}
                >
                  Dịch Vụ
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/about"
                  className="nav-link"
                  onClick={closeMenu}
                  style={{ fontSize: "18px" }}
                >
                  Các Khóa Học
                </Link>
              </li>
              <li className="nav-item mobile-auth">
                {!loggedIn ? (
                  <Link to="/login" className="nav-link" onClick={closeMenu}>
                    Đăng nhập
                  </Link>
                ) : (
                  <>
                    <Link to="/admin" className="nav-link" onClick={closeMenu}>
                      Admin Panel
                    </Link>
                    <button
                      onClick={() => {
                        onLogout();
                        closeMenu();
                      }}
                      className="nav-link logout-btn"
                    >
                      Đăng xuất
                    </button>
                  </>
                )}
              </li>
            </ul>
          </div>

          {/* Nửa phải: Actions + Hamburger */}
          <div className="nav-right">
            <div className="nav-actions">
              {!loggedIn ? (
                <Link to="/login" className="nav-link">
                  Đăng nhập
                </Link>
              ) : (
                <>
                  <Link to="/admin" className="nav-link">
                    Admin Panel
                  </Link>
                  <button
                    onClick={onLogout}
                    className="nav-link logout-btn"
                    style={{ marginLeft: "8px" }}
                  >
                    Đăng xuất
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu icon */}
            <div
              className={`hamburger ${isMenuOpen ? "active" : ""}`}
              onClick={toggleMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
