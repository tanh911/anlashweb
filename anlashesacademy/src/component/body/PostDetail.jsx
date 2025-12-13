import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./PostDetail.css";

const API_BASE = import.meta.env.VITE_API_URL;

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hàm format date an toàn
  const formatDate = (dateString) => {
    if (!dateString) return "Không có ngày";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Ngày không hợp lệ";
      }
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Lỗi format date:", error);
      return "Lỗi ngày";
    }
  };

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);

        // Gọi API để lấy chi tiết bài viết
        const response = await fetch(`${API_BASE}/content/posts/${id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setPost(data.data); // SỬA: data.data thay vì data
        } else {
          setError(data.message || "Không tìm thấy bài viết");
        }
      } catch (err) {
        console.error("💥 Fetch error:", err);
        setError("Lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPostDetail();
    }
  }, [id]);

  const handleBackClick = () => {
    navigate(-1);
  };

  // Debug state

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Đang tải bài viết...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="error-container">
        <div className="error-message">
          {error || "Không tìm thấy bài viết"}
        </div>
        <button onClick={handleBackClick} className="back-button">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <button onClick={handleBackClick} className="back-button">
        ← Quay lại
      </button>

      <article className="post-detail">
        <header className="post-detail-header">
          <h1 className="post-detail-title">
            {post.title || "Không có tiêu đề"}
          </h1>

          <div className="post-detail-meta">
            <span className="post-date">{formatDate(post.createdAt)}</span>
            {post.author && (
              <span className="post-author">Tác giả: {post.author}</span>
            )}
          </div>
        </header>

        {/* Hiển thị tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-detail-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Hiển thị nội dung với markdown support */}
        <div className="post-detail-content">
          <ReactMarkdown>{post.content || "Không có nội dung"}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}

export default PostDetail;
