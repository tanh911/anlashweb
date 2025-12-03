import React, { useState } from "react";
import { saveSliderImages } from "../firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import "./SliderImageUploader.css";

const SliderImageUploader = ({
  loggedIn,
  onUploadSuccess,
  existingImages = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  if (!loggedIn) {
    return null;
  }

  // Lọc bỏ các giá trị null từ existingImages
  const validExistingImages = Array.isArray(existingImages)
    ? existingImages.filter(
        (img) => img !== null && img !== undefined && img !== ""
      )
    : [];

  // Kiểm tra xem ảnh đã tồn tại chưa (dựa trên URL)
  const isDuplicateImage = (url, imagesList) => {
    return imagesList.some((image) => image === url);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPEG, PNG, GIF)");
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      console.log("🔄 Bắt đầu upload ảnh slider:", file.name);

      // Upload lên Cloudinary
      const downloadURL = await uploadToCloudinary(file);
      console.log("✅ Upload slider thành công:", downloadURL);

      // Kiểm tra trùng lặp
      if (isDuplicateImage(downloadURL, validExistingImages)) {
        setError("Ảnh này đã tồn tại trong slider");
        setUploading(false);
        return;
      }

      // Giới hạn số lượng ảnh (tùy chọn)
      const MAX_SLIDER_IMAGES = 10;
      if (validExistingImages.length >= MAX_SLIDER_IMAGES) {
        setError(`Chỉ có thể upload tối đa ${MAX_SLIDER_IMAGES} ảnh slider`);
        setUploading(false);
        return;
      }

      // Cập nhật danh sách ảnh slider - LOẠI BỎ CÁC GIÁ TRỊ NULL
      const updatedImages = [...validExistingImages, downloadURL];

      console.log("🖼️ Updated slider images:", updatedImages);
      await saveSliderImages(updatedImages);
      console.log("✅ Đã lưu slider images");

      if (onUploadSuccess) {
        onUploadSuccess(downloadURL, updatedImages);
      }

      alert("✅ Upload ảnh slider thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi upload ảnh slider:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi slider?")) {
      return;
    }

    try {
      // Xóa ảnh khỏi mảng đã lọc
      const updatedImages = validExistingImages.filter((_, i) => i !== index);

      // LƯU MẢNG ĐÃ LỌC (KHÔNG CÓ NULL) VÀO FIREBASE
      await saveSliderImages(updatedImages);

      if (onUploadSuccess) {
        onUploadSuccess(null, updatedImages);
      }

      alert("✅ Đã xóa ảnh khỏi slider!");
    } catch (error) {
      console.error("❌ Lỗi khi xóa ảnh:", error);
      alert("❌ Lỗi khi xóa ảnh. Vui lòng thử lại.");
    }
  };

  const handleMultipleDelete = async () => {
    if (imagesToDelete.length === 0) {
      alert("Vui lòng chọn ít nhất một ảnh để xóa");
      return;
    }

    if (
      !window.confirm(`Bạn có chắc chắn muốn xóa ${imagesToDelete.length} ảnh?`)
    ) {
      return;
    }

    try {
      // Tạo danh sách mới sau khi xóa - sử dụng validExistingImages
      const updatedImages = validExistingImages.filter(
        (_, index) => !imagesToDelete.includes(index)
      );

      // Lưu danh sách mới vào Firebase - CHỈ LƯU MẢNG ĐÃ LỌC
      await saveSliderImages(updatedImages);
      setImagesToDelete([]);

      if (onUploadSuccess) {
        onUploadSuccess(null, updatedImages);
      }

      alert(`✅ Đã xóa ${imagesToDelete.length} ảnh khỏi slider!`);
    } catch (error) {
      console.error("❌ Lỗi khi xóa nhiều ảnh:", error);
      alert("❌ Lỗi khi xóa ảnh. Vui lòng thử lại.");
    }
  };

  const toggleImageSelection = (index) => {
    if (imagesToDelete.includes(index)) {
      setImagesToDelete(imagesToDelete.filter((i) => i !== index));
    } else {
      setImagesToDelete([...imagesToDelete, index]);
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

  // Upload nhiều file cùng lúc
  const handleMultipleUpload = async (files) => {
    if (files.length === 0) return;

    const validFiles = Array.from(files).filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      setError("Không có file ảnh hợp lệ");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedUrls = [];
      const MAX_SLIDER_IMAGES = 10;
      let uploadCount = 0;

      for (const file of validFiles) {
        // Kiểm tra giới hạn
        if (validExistingImages.length + uploadCount >= MAX_SLIDER_IMAGES) {
          alert(`Đã đạt giới hạn ${MAX_SLIDER_IMAGES} ảnh slider`);
          break;
        }

        try {
          const downloadURL = await uploadToCloudinary(file);

          // Kiểm tra trùng lặp
          if (
            !isDuplicateImage(downloadURL, [
              ...validExistingImages,
              ...uploadedUrls,
            ])
          ) {
            uploadedUrls.push(downloadURL);
            uploadCount++;
          }
        } catch (error) {
          console.error("Lỗi upload file:", file.name, error);
        }
      }

      if (uploadedUrls.length > 0) {
        const updatedImages = [...validExistingImages, ...uploadedUrls];
        await saveSliderImages(updatedImages);

        if (onUploadSuccess) {
          onUploadSuccess(null, updatedImages);
        }

        alert(`✅ Đã upload thành công ${uploadedUrls.length} ảnh!`);
      } else {
        setError("Không có ảnh nào được upload (có thể đã bị trùng)");
      }
    } catch (error) {
      console.error("❌ Lỗi khi upload nhiều ảnh:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleFileInput = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      handleMultipleUpload(files);
    }
  };

  // Hàm để xóa tất cả các giá trị null từ Firebase

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <div className="header-left">
          <h3>Quản lý Ảnh Slider</h3>
        </div>
        {imagesToDelete.length > 0 && (
          <button
            style={{
              backgroundColor: "red",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            onClick={handleMultipleDelete}
          >
            🗑️ Xóa ({imagesToDelete.length})
          </button>
        )}
      </div>

      <div
        className={`upload-area ${dragOver ? "drag-over" : ""} ${
          uploading ? "uploading" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            if (files.length > 1) {
              handleMultipleUpload(files);
            } else {
              handleFileUpload(files[0]);
            }
          }
        }}
      >
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Đang upload ảnh slider...</p>
          </div>
        ) : (
          <>
            <p className="upload-text">📷 Thêm ảnh vào slider</p>
            <p className="upload-requirements">
              JPEG, PNG, GIF - Tối đa 5MB - Tối đa 10 ảnh
            </p>
            <div className="upload-buttons">
              <label className="upload-btn">
                Upload 1 ảnh
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                  className="file-input"
                />
              </label>
              <label className="upload-btn multiple">
                Upload nhiều ảnh
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMultipleFileInput}
                  disabled={uploading}
                  className="file-input"
                  multiple
                />
              </label>
            </div>
            <p className="drag-drop-text">hoặc kéo thả ảnh vào đây</p>
          </>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Hiển thị danh sách ảnh slider hiện tại */}
      {validExistingImages.length > 0 && (
        <div className="current-images">
          <div className="images-header">
            <h4>
              Ảnh slider hiện tại ({validExistingImages.length}/10)
              {existingImages.length !== validExistingImages.length && (
                <span className="warning-count">
                  ({existingImages.length - validExistingImages.length} ảnh
                  null)
                </span>
              )}
              {imagesToDelete.length > 0 && (
                <span className="selected-count">
                  - Đã chọn: {imagesToDelete.length}
                </span>
              )}
            </h4>
          </div>

          <div className="images-grid">
            {validExistingImages.map((image, index) => (
              <div
                key={index}
                className={`image-item ${
                  imagesToDelete.includes(index) ? "selected" : ""
                }`}
                onClick={() => toggleImageSelection(index)}
              >
                <div className="image-checkbox">
                  <input
                    type="checkbox"
                    checked={imagesToDelete.includes(index)}
                    onChange={() => toggleImageSelection(index)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "#007bff",
                      transform: "scale(1.2)",
                      margin: "5px",
                    }}
                  />
                </div>
                <img src={image} alt={`Slider ${index + 1}`} loading="lazy" />
                <div
                  className="image-info"
                  style={{ marginLeft: "5px", alignItems: "center" }}
                >
                  <span>Ảnh {index + 1}</span>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(index);
                    }}
                    title="Xóa ảnh này"
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      marginLeft: "10px",
                    }}
                  >
                    Xóa
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

export default SliderImageUploader;
