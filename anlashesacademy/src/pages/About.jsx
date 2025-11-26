import React, { useState, useEffect } from "react";
import "./About.css";
import axios from "axios";
import { Link } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL;

export default function About({ loggedIn }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    price: "",
    duration: "",
    level: "beginner",
  });

  // Fetch courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load courses - FETCH TRỰC TIẾP
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_BASE}/courses/get_courses`);
      setCourses(response.data.data || []);
    } catch (err) {
      setError("Lỗi khi tải danh sách khóa học: " + err.message);
      console.error("Load courses error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create course - FETCH TRỰC TIẾP
  const createCourse = async (courseData) => {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${API_BASE}/courses/create`,
      courseData, // payload
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    return response.data;
  };

  // Update course - FETCH TRỰC TIẾP
  const updateCourse = async (courseId, courseData) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_BASE}/courses/${courseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi cập nhật khóa học");
    }

    return await response.json();
  };

  // Delete course - FETCH TRỰC TIẾP
  const deleteCourse = async (courseId) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_BASE}/courses/${courseId}`, {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi xóa khóa học");
    }

    return await response.json();
  };

  // Toggle publish - FETCH TRỰC TIẾP

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const handleArrayInput = (field, value) => {
  //   const items = value.split("\n").filter((item) => item.trim() !== "");
  //   setFormData((prev) => ({
  //     ...prev,
  //     [field]: items,
  //   }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      console.log("Form data:", formData);

      // Chuẩn bị dữ liệu đúng với model
      const courseData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price) || 0,
        duration: formData.duration,
        level: formData.level || "Cơ bản",
        // KHÔNG gửi instructor object nếu model không hỗ trợ
        // instructor sẽ được gắn tự động từ token ở backend
      };

      console.log("Course data to send:", courseData);

      if (editingCourse) {
        await updateCourse(editingCourse._id, courseData);
      } else {
        await createCourse(courseData);
      }

      resetForm();
      await loadCourses();

      alert(
        editingCourse
          ? "Cập nhật khóa học thành công!"
          : "Tạo khóa học thành công!"
      );
    } catch (err) {
      console.error("Submit error:", err);
      setError("Lỗi khi lưu khóa học: " + err.message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      shortDescription: course.shortDescription || "",
      price: course.price?.toString() || "",
      duration: course.duration || "",
      level: course.level || "beginner",
    });
    setShowCourseForm(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Bạn có chắc muốn xóa khóa học này?")) {
      try {
        setError("");
        await deleteCourse(courseId);
        await loadCourses();
        alert("Xóa khóa học thành công!");
      } catch (err) {
        setError("Lỗi khi xóa khóa học: " + err.message);
      }
    }
  };

  const resetForm = () => {
    setShowCourseForm(false);
    setEditingCourse(null);
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
      price: "",
      duration: "",
      level: "Cơ bản",
    });
  };

  // Thống kê

  if (loading) {
    return (
      <div className="about-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">Về Chúng Tôi</h1>
          <p className="hero-subtitle">
            Nền tảng giáo dục công nghệ hàng đầu, mang đến những khóa học chất
            lượng và cơ hội phát triển nghề nghiệp cho cộng đồng
          </p>
          {loggedIn && (
            <button
              className="btn-add-course"
              onClick={() => setShowCourseForm(true)}
            >
              + Thêm Khóa Học Mới
            </button>
          )}
        </div>
      </section>

      {/* Các khóa học */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2>Khóa Học Nổi Bật</h2>
            <p style={{ color: "white" }}>
              Khám phá các chương trình đào tạo được thiết kế bài bản và cập
              nhật nhất
            </p>
            {loggedIn && (
              <div className="admin-actions">
                <span className="course-count">
                  Tổng số: {courses.length} khóa học
                </span>
                {/* <button
                  className="btn-refresh"
                  onClick={loadCourses}
                  title="Làm mới danh sách"
                >
                  🔄
                </button> */}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
              <button className="btn-retry" onClick={loadCourses}>
                Thử lại
              </button>
            </div>
          )}

          <div className="courses-grid">
            {courses.map((course) => (
              <div
                key={course._id}
                className={`course-card ${
                  !course.isPublished ? "unpublished" : ""
                }`}
              >
                <div className="course-header">
                  <h3 className="course-title">{course.title}</h3>
                </div>

                <p className="course-description">
                  {course.shortDescription || course.description}
                </p>

                <div className="course-meta">
                  <span className="meta-item">📊 {course.level}</span>
                  <span className="meta-item">⏱️ {course.duration}</span>
                  {course.certificateIncluded && (
                    <span className="meta-item certificate">📜 Chứng chỉ</span>
                  )}
                </div>

                {course.features && course.features.length > 0 && (
                  <div className="course-features">
                    <strong>Điểm nổi bật:</strong>
                    <div className="features-list">
                      {course.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="feature-tag">
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="course-price">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(course.price)}
                </div>

                <div className="course-actions">
                  <Link to={`/login`} className="enroll-button">
                    Đăng kí khóa học
                  </Link>

                  {loggedIn && (
                    <div className="admin-controls">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(course)}
                        title="Chỉnh sửa"
                      >
                        ✏️ Sửa
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(course._id)}
                        title="Xóa khóa học"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form thêm/sửa khóa học (Modal) */}
      {showCourseForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {editingCourse ? "Chỉnh sửa Khóa Học" : "Thêm Khóa Học Mới"}
              </h2>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên khóa học *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên khóa học"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mô tả ngắn</label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Mô tả ngắn gọn về khóa học"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mô tả chi tiết *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    required
                    placeholder="Mô tả chi tiết về nội dung khóa học"
                  />
                </div>

                <div className="form-group">
                  <label>Giá (VND) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Thời lượng *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 6 tháng, 8 tuần..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Trình độ *</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                    <option value="all">Mọi trình độ</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-cancel"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {editingCourse ? "Cập nhật" : "Tạo khóa học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
