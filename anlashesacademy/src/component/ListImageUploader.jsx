import React, { useState } from "react";
import { saveImageList } from "../firebase/firestore"; // Giả sử có hàm này
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import "./ListImageUploader.css";

const ListImageUploader = ({
  loggedIn,
  onUploadSuccess,
  existingImages = [],
  maxImages = 10,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  if (!loggedIn) {
    return null;
  }

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Kiểm tra số lượng ảnh tối đa
    if (existingImages.length >= maxImages) {
      setError(`Đã đạt tối đa ${maxImages} ảnh`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPEG, PNG, GIF)");
      return;
    }

    setUploading(true);
    setError("");

    try {
      console.log("🔄 Bắt đầu upload ảnh vào list:", file.name);

      const downloadURL = await uploadToCloudinary(file);
      console.log("✅ Upload list ảnh thành công:", downloadURL);

      // Cập nhật danh sách ảnh
      const currentImages = Array.isArray(existingImages) ? existingImages : [];
      const updatedImages = [...currentImages, downloadURL];

      console.log("🖼️ Updated list images:", updatedImages);
      await saveImageList(updatedImages); // Hàm lưu list ảnh
      console.log("✅ Đã lưu list images");

      if (onUploadSuccess) {
        onUploadSuccess(updatedImages);
      }

      alert("✅ Upload ảnh thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi upload ảnh:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleFileUpload = async (files) => {
    const filesArray = Array.from(files);
    const remainingSlots = maxImages - existingImages.length;

    if (filesArray.length > remainingSlots) {
      setError(`Chỉ có thể upload thêm ${remainingSlots} ảnh`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadPromises = filesArray.map((file) => uploadToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      const currentImages = Array.isArray(existingImages) ? existingImages : [];
      const updatedImages = [...currentImages, ...uploadedUrls];

      await saveImageList(updatedImages);

      if (onUploadSuccess) {
        onUploadSuccess(updatedImages);
      }

      alert(`✅ Upload thành công ${uploadedUrls.length} ảnh!`);
    } catch (error) {
      console.error("❌ Lỗi khi upload nhiều ảnh:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      if (files.length > 1) {
        handleMultipleFileUpload(files);
      } else {
        handleFileUpload(files[0]);
      }
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
      if (files.length > 1) {
        handleMultipleFileUpload(files);
      } else {
        handleFileUpload(files[0]);
      }
    }
  };

  const removeImage = async (indexToRemove) => {
    try {
      const updatedImages = existingImages.filter(
        (_, index) => index !== indexToRemove
      );
      await saveImageList(updatedImages);

      if (onUploadSuccess) {
        onUploadSuccess(updatedImages);
      }

      alert("✅ Đã xóa ảnh thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi xóa ảnh:", error);
      setError("Lỗi khi xóa ảnh. Vui lòng thử lại.");
    }
  };

  return (
    <div className="image-uploader">
      <h3>Quản lý Danh sách Ảnh</h3>

      <div className="upload-info">
        <span>
          {existingImages.length}/{maxImages} ảnh
        </span>
      </div>

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
            <p className="upload-text">📁 Upload ảnh (kéo thả hoặc click)</p>
            <p className="upload-requirements">
              JPEG, PNG, GIF - Tối đa 5MB - Có thể chọn nhiều ảnh
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={uploading || existingImages.length >= maxImages}
              className="file-input"
              multiple
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

      {/* Hiển thị danh sách ảnh với chức năng xóa */}
      {existingImages.length > 0 && (
        <div className="current-images">
          <h4>Danh sách ảnh ({existingImages.length})</h4>
          <div className="images-grid">
            {existingImages.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image} alt={`Ảnh ${index + 1}`} />
                <div className="image-actions">
                  <span>Ảnh {index + 1}</span>
                  <button
                    onClick={() => removeImage(index)}
                    className="delete-btn"
                    title="Xóa ảnh"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListImageUploader;
