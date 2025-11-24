import React, { useState, useEffect } from "react";
import Slider from "../component/body/Slider.jsx";
import ImageUploader from "../component/ImageUploader";
import axios from "axios";
import "./Home.css";
import PostEditor from "../component/body/Context.jsx";
import { listenToSliderImages } from "../firebase/firestore.js"; // THÊM IMPORT NÀY
import { Link, NavLink } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function Home({ loggedIn }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [sliderImages, setSliderImages] = useState([]);
  useEffect(() => {
    const unsubscribe = listenToSliderImages((images) => {
      setSliderImages(images || []);
    });
    fetchPosts();
    return unsubscribe;
  }, []);
  const fetchPosts = async () => {
    try {
      console.log(
        "🔄 Fetching posts from:",
        `${API_BASE}/content/posts/published`
      );

      const response = await axios.get(`${API_BASE}/content/posts/published`);

      // Kiểm tra cấu trúc response
      if (response.data && response.data.success) {
        setPosts(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} posts`);
      } else {
        console.log("❌ API response not successful:", response.data);
        setPosts([]);
      }
    } catch (error) {
      console.error("❌ Error loading posts:", error);
      console.error("Error details:", error.response?.data || error.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Nổi bật</h1>
      <div className="first-container">
        <Slider loggedIn={loggedIn} />
        {loggedIn && (
          <ImageUploader
            loggedIn={true}
            existingImages={sliderImages} // QUAN TRỌNG
            onUploadSuccess={(newImage) => {
              console.log("🆕 Ảnh mới được upload:", newImage);
              // Có thể cập nhật state ở đây nếu cần
            }}
            uploadType="slider"
            buttonText="Thêm ảnh vào slider"
          />
        )}
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
                {/* <div className="post-author">Tác giả: {post.author}</div> */}
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

      <div className="third-container">
        <h2 className="cta-title">Sẵn Sàng Làm Đẹp?</h2>
        <p className="cta-description">
          Khám phá bộ sưu tập sản phẩm làm đẹp độc quyền của chúng tôi
        </p>
        <nav>
          <Link to="/appointment" className="cta-button">
            Đặt lịch ngay
          </Link>
        </nav>
      </div>

      <div className="second-container">
        <div className="features-grid">
          <div className="feature-item">
            <h3>Chất Lượng Cao Cấp</h3>
          </div>
          <div className="feature-item">
            <h3>Đặt Lịch Nhanh</h3>
          </div>
          <div className="feature-item">
            <h3>Hỗ Trợ 24/7</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
