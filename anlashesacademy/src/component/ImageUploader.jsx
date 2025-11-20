import React, { useState } from "react";
import { saveSliderImages, saveAds } from "../firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinaryUpload"; // Import Cloudinary
import "./ImageUploader.css";

const ImageUploader = ({
  loggedIn,
  onUploadSuccess,
  existingImages = [],
  buttonText = "Upload Image",
  uploadType = "slider",
  adIndex = 0,
  existingAds = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  if (!loggedIn) {
    return null;
  }

  // ImageUploader.jsx - Sửa hàm handleFileUpload
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      console.log("🔄 Bắt đầu upload file:", file.name);
      console.log("📸 Existing images:", existingImages);
      console.log("🎯 Upload type:", uploadType);

      // DÙNG CLOUDINARY
      const downloadURL = await uploadToCloudinary(file);
      console.log("✅ Upload thành công:", downloadURL);

      // Xử lý khác nhau cho slider và ad
      if (uploadType === "slider") {
        // QUAN TRỌNG: Đảm bảo existingImages là array
        const currentImages = Array.isArray(existingImages)
          ? existingImages
          : [];
        const updatedImages = [...currentImages, downloadURL];

        console.log("🖼️ Updated slider images:", updatedImages);

        await saveSliderImages(updatedImages);
        console.log("✅ Đã lưu slider images");
      } else if (uploadType === "ad") {
        const updatedAds = [...existingAds];
        updatedAds[adIndex] = downloadURL;
        await saveAds(updatedAds);
        console.log("✅ Đã lưu ads");
      }

      if (onUploadSuccess) {
        onUploadSuccess(downloadURL);
      }

      alert("✅ Upload ảnh thành công!");
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
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="image-uploader">
      <div
        className={`upload-area ${dragOver ? "drag-over" : ""} ${
          uploading ? "uploading" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Đang upload ảnh...</p>
          </div>
        ) : (
          <>
            <p className="upload-text">{buttonText}</p>
            <p className="upload-requirements">JPEG, PNG, GIF - Tối đa 5MB</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={uploading}
              className="file-input"
            />
          </>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
