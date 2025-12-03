import React, { useState } from "react";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { saveImageToFolder } from "../firebase/firestore";
import "./FolderImageUploader.css";

const FolderImageUploader = ({
  loggedIn,
  onUploadSuccess,
  folderId,
  buttonText = "Upload ảnh",
  variant = "default", // default, small, large, outline, success, warning
  showFileName = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  if (!loggedIn || !folderId) {
    return null;
  }

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB");
      return;
    }

    setUploading(true);
    setError("");
    setFileName(file.name);

    try {
      // Upload lên Cloudinary
      const downloadURL = await uploadToCloudinary(file);

      // Lưu vào Firebase với folderId
      await saveImageToFolder(folderId, downloadURL);

      if (onUploadSuccess) {
        onUploadSuccess(downloadURL, folderId);
      }

      alert("✅ Upload ảnh thành công!");
      setFileName(""); // Reset tên file sau khi upload thành công
    } catch (error) {
      console.error("❌ Lỗi khi upload ảnh:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="folder-uploader">
      <label
        className={`upload-button ${variant} ${uploading ? "uploading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={uploading}
          className="file-input"
        />

        {uploading ? (
          <div className="uploading-spinner">
            <div className="spinner"></div>
            Đang upload...
          </div>
        ) : (
          <>
            <span className="upload-icon">📸</span>
            <span className="upload-text">{buttonText}</span>
          </>
        )}

        <div className="loading-bar"></div>
      </label>

      {showFileName && fileName && (
        <div className="file-name-display">
          <span className="file-icon">📄</span>
          <span className="file-name">{fileName}</span>
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default FolderImageUploader;
