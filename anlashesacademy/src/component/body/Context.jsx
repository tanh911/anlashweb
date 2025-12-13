// components/body/Context.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import "./Context.css";
const API_BASE = import.meta.env.VITE_API_URL;

const PostEditor = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Hàm upload ảnh trực tiếp từ FE
  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh (JPEG, PNG, GIF)!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Upload trực tiếp lên Cloudinary từ FE
      const imageUrl = await uploadToCloudinary(file);

      // Chèn ảnh vào vị trí con trỏ
      insertImageAtCursor(imageUrl, file.name);
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      alert("Lỗi khi upload ảnh: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Hàm chèn ảnh vào vị trí con trỏ
  const insertImageAtCursor = (imageUrl, altText) => {
    const textarea = document.querySelector(".content-textarea");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const imageMarkdown = `\n![${altText}](${imageUrl})\n`;

    const newContent =
      content.substring(0, start) + imageMarkdown + content.substring(end);
    setContent(newContent);

    // Focus lại textarea và đặt con trỏ sau ảnh
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + imageMarkdown.length;
      textarea.selectionEnd = start + imageMarkdown.length;
    }, 0);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
    event.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    if (!content.trim()) {
      alert("Vui lòng nhập nội dung");
      return;
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      author: "Admin",
      status: "published",
      tags: tags.filter((tag) => tag.trim() !== ""),
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // eslint-disable-next-line no-unused-vars
      const response = await axios.post(`${API_BASE}/content/posts`, postData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onSave();
      alert("✅ Bài viết đã được đăng thành công!");
    } catch (error) {
      console.error("❌ Error creating post:", error);
      alert(
        `Lỗi khi tạo bài viết: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="post-editor-overlay">
      <div className="post-editor">
        <div className="editor-header">
          <h2>✏️ Viết Bài Mới</h2>
          <div className="editor-actions">
            <button onClick={onCancel} className="cancel-btn" disabled={saving}>
              Hủy
            </button>
            <button onClick={handleSave} disabled={saving} className="save-btn">
              {saving ? "⏳ Đang đăng..." : "📤 Đăng bài"}
            </button>
          </div>
        </div>

        <div className="editor-body">
          <div className="form-group">
            <label>📝 Tiêu đề bài viết</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề hấp dẫn..."
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>📄 Nội dung bài viết</label>
            <div className="editor-toolbar">
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploadingImage || saving}
                className="image-upload-btn"
              >
                {uploadingImage ? "⏳ Đang upload..." : "🖼️ Chèn ảnh"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploadingImage || saving}
                style={{ display: "none" }}
              />
            </div>

            <div
              className="content-editor-wrapper"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <textarea
                className="content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Viết nội dung bài viết của bạn ở đây... 
Bạn có thể:
• Kéo thả ảnh vào khung này
• Click nút 'Chèn ảnh' để thêm ảnh
• Ảnh sẽ được chèn vào vị trí con trỏ"
                disabled={saving}
                rows={15}
              />
            </div>

            <div className="editor-hint">
              💡 <strong>Mẹo:</strong> Kéo thả ảnh trực tiếp vào khung nội dung
              hoặc click nút "Chèn ảnh"
            </div>
          </div>

          <div className="form-group">
            <label>🏷️ Tags (tối đa 5 tags)</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Nhập tag và ấn Enter..."
                disabled={saving || tags.length >= 5}
              />
              <button
                onClick={addTag}
                disabled={saving || !tagInput.trim() || tags.length >= 5}
              >
                Thêm
              </button>
            </div>
            <div className="tags-list">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button onClick={() => removeTag(tag)} disabled={saving}>
                    ×
                  </button>
                </span>
              ))}
              {tags.length >= 5 && (
                <div className="tags-limit">Đã đạt tối đa 5 tags</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
