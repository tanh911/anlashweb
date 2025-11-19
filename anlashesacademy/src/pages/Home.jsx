import React, { useState, useEffect } from "react";
import Slider from "../component/body/Slider.jsx";
import ImageUploader from "../component/ImageUploader";
import axios from "axios";
import "./Home.css";

const API_BASE = "http://localhost:5000/api";

export default function Home({ loggedIn }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostEditor, setShowPostEditor] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/content/posts/published`);
      setPosts(response.data.data);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Nổi bật</h1>
      <div className="first-container">
        <Slider loggedIn={loggedIn} />
        {loggedIn && <ImageUploader loggedIn={loggedIn} />}
      </div>

      {/* Blog Posts Section */}
      <div className="posts-container">
        <div className="posts-header">
          <h2>📝 Bài Viết Mới Nhất</h2>
          {loggedIn && (
            <button
              className="create-post-btn"
              onClick={() => setShowPostEditor(true)}
            >
              ✏️ Viết Bài Mới
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Đang tải bài viết...</div>
        ) : posts.length > 0 ? (
          <div className="posts-grid">
            {posts.slice(0, 3).map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <h3 className="post-title">{post.title}</h3>
                  <span className="post-date">
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="post-author">Tác giả: {post.author}</div>
                <p className="post-content">
                  {post.content.length > 150
                    ? post.content.substring(0, 150) + "..."
                    : post.content}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <p>Chưa có bài viết nào. {loggedIn && "Hãy viết bài đầu tiên!"}</p>
          </div>
        )}
      </div>

      {/* Post Editor Modal */}
      {showPostEditor && loggedIn && (
        <PostEditor
          onSave={() => {
            setShowPostEditor(false);
            fetchPosts(); // Refresh posts after saving
          }}
          onCancel={() => setShowPostEditor(false)}
        />
      )}

      <div className="second-container">
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">✨</div>
            <h3>Chất Lượng Cao Cấp</h3>
            <p>
              Sản phẩm được chọn lọc kỹ lưỡng với tiêu chuẩn chất lượng quốc tế
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🚀</div>
            <h3>Giao Hàng Nhanh</h3>
            <p>Miễn phí giao hàng toàn quốc trong vòng 24h</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💫</div>
            <h3>Hỗ Trợ 24/7</h3>
            <p>Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ</p>
          </div>
        </div>
      </div>

      <div className="third-container">
        <h2 className="cta-title">Sẵn Sàng Làm Đẹp?</h2>
        <p className="cta-description">
          Khám phá bộ sưu tập sản phẩm làm đẹp độc quyền của chúng tôi
        </p>
        <button className="cta-button">Mua Ngay</button>
        <div className="stats">
          <div className="stat">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Khách Hàng Hài Lòng</div>
          </div>
          <div className="stat">
            <div className="stat-number">500+</div>
            <div className="stat-label">Sản Phẩm Chất Lượng</div>
          </div>
          <div className="stat">
            <div className="stat-number">99%</div>
            <div className="stat-label">Đánh Giá Tích Cực</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Post Editor Component
const PostEditor = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    tags: "",
    isPublished: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      await axios.post(
        `${API_BASE}/content/posts`,
        {
          title: formData.title,
          content: formData.content,
          author: formData.author,
          tags: tagsArray,
          isPublished: formData.isPublished,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Bài viết đã được tạo thành công!");
      onSave();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Lỗi khi tạo bài viết!");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="post-editor-overlay">
      <div className="post-editor">
        <div className="editor-header">
          <h2>✏️ Viết Bài Mới</h2>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-editor-form">
          <div className="form-group">
            <label>Tiêu đề bài viết *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề bài viết..."
              className="text-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Tác giả *</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Tên tác giả..."
              className="text-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Nội dung bài viết *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Viết nội dung bài viết của bạn ở đây..."
              className="post-content-input"
              rows="10"
              required
            />
          </div>

          <div className="form-group">
            <label>Tags (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="làm đẹp, skincare, makeup..."
              className="text-input"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Đăng bài ngay
            </label>
          </div>

          <div className="editor-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              disabled={saving}
            >
              Hủy
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Đang đăng..." : "Đăng Bài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
