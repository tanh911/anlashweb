import React, { useState, useEffect } from "react";
import Slider from "../component/body/Slider.jsx";
import axios from "axios";
import "./Home.css";
import PostEditor from "../component/body/Context.jsx";
import { listenToSliderImages } from "../firebase/firestore.js"; // THÊM IMPORT NÀY
import { Link, NavLink, useNavigate } from "react-router-dom";
import SliderImageUploader from "../component/SliderImageUploader.jsx";
const API_BASE = import.meta.env.VITE_API_URL;

export default function Home({ loggedIn }) {
  const navigate = useNavigate();
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
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Không có ngày";

    try {
      const date = new Date(dateString);
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        return "Ngày không hợp lệ";
      }
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      console.error("Lỗi format date:", error);
      return "Lỗi ngày";
    }
  };
  return (
    <div className="container">
      <h1>Nổi bật</h1>
      <div className="first-container">
        <Slider loggedIn={loggedIn} />
        {loggedIn && (
          <SliderImageUploader
            loggedIn={loggedIn}
            existingImages={sliderImages} // QUAN TRỌNG
            onUploadSuccess={(newImage) => {
              setSliderImages((prev) => [...prev, newImage]);
            }}
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
        ) : posts && posts.length > 0 ? (
          <div className="posts-grid">
            {posts.slice(0, 3).map((post) => {
              const extractFirstImage = (content) => {
                const markdownMatch = content.match(
                  /!\[.*?\]\((https?:\/\/[^\s)]+)\)/
                );
                if (markdownMatch) return markdownMatch[1];

                const htmlMatch = content.match(/<img[^>]+src="([^">]+)"/);
                if (htmlMatch) return htmlMatch[1];

                const urlMatch = content.match(
                  /\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp))\)/i
                );
                if (urlMatch) return urlMatch[1];

                return null;
              };

              const getCleanContent = (content) => {
                if (!content) return "Nội dung trống";

                let cleanContent = content
                  .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, "")
                  .replace(/<img[^>]*>/g, "")
                  .replace(
                    /\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp))\)/gi,
                    ""
                  )
                  .trim();

                if (!cleanContent) return "Bài viết có hình ảnh";

                return cleanContent;
              };

              const imageUrl = extractFirstImage(post.content);
              const cleanContent = getCleanContent(post.content);

              return (
                <div
                  key={post._id}
                  className="post-card"
                  onClick={() => handlePostClick(post._id)}
                  style={{ cursor: "pointer" }}
                >
                  {imageUrl && (
                    <div className="post-image">
                      <img
                        src={imageUrl}
                        alt={post.title}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="post-header">
                    <h3 className="post-title">
                      {post.title || "Không có tiêu đề"}
                    </h3>
                    <span className="post-date">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  <p className="post-content">
                    {cleanContent.length > 150
                      ? cleanContent.substring(0, 150) + "..."
                      : cleanContent}
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

                  <div className="read-more">
                    <span className="read-more-text">Đọc thêm →</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-posts">
            <p>Chưa có bài viết nào.</p>
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
