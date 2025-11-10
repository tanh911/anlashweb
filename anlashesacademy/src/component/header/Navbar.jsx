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
                style={{ textDecoration: "none" }}
              >
                Tên website
              </Link>
            </div>

            {/* Menu */}
            <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
              <li className="nav-item">
                <Link to="/" className="nav-link" onClick={closeMenu}>
                  Trang Chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/appointment"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  Đặt lịch
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/gallery" className="nav-link" onClick={closeMenu}>
                  Mẫu ảnh
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/about" className="nav-link" onClick={closeMenu}>
                  Về Chúng Tôi
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/contact" className="nav-link" onClick={closeMenu}>
                  Liên Hệ
                </Link>
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
