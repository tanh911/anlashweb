import React, { useState, useEffect, useMemo } from "react";
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

  // 🎯 SỬA: Dùng useMemo thay vì state + useEffect
  const validExistingImages = useMemo(() => {
    if (!Array.isArray(existingImages)) {
      console.warn("existingImages không phải array:", existingImages);
      return [];
    }

    // Lọc null/undefined/empty
    const filtered = existingImages.filter(
      (img) => img !== null && img !== undefined && img !== ""
    );

    // 🎯 LOẠI BỎ TRÙNG LẶP TRONG MẢNG
    const uniqueImages = [...new Set(filtered)];

    // Log để debug
    if (filtered.length !== uniqueImages.length) {
      console.warn(
        `⚠️ Đã loại bỏ ${filtered.length - uniqueImages.length} ảnh trùng`
      );
    }

    return uniqueImages;
  }, [existingImages]); // ✅ Chỉ phụ thuộc vào existingImages

  // 🎯 SỬA: Reset selection khi images thay đổi
  useEffect(() => {
    setImagesToDelete([]);
  }, [validExistingImages]); // ✅ Chỉ reset khi validExistingImages thay đổi

  if (!loggedIn) {
    return null;
  }

  // Kiểm tra xem ảnh đã tồn tại chưa (dựa trên URL)
  const isDuplicateImage = (url, imagesList) => {
    if (!url) return false;

    // Kiểm tra exact URL match
    if (imagesList.some((image) => image === url)) {
      return true;
    }

    // 🎯 KIỂM TRA THÊM: So sánh filename để phát hiện trùng
    try {
      const newFileName = url.split("/").pop().split("?")[0];
      return imagesList.some((image) => {
        const existingFileName = image.split("/").pop().split("?")[0];
        return newFileName === existingFileName;
      });
    } catch (e) {
      console.log(e);
      return false;
    }
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
      // Upload lên Cloudinary
      const downloadURL = await uploadToCloudinary(file);

      // 🎯 KIỂM TRA TRÙNG LẶP VỚI validExistingImages
      if (isDuplicateImage(downloadURL, validExistingImages)) {
        console.warn("⚠️ Ảnh đã tồn tại (duplicate check):", downloadURL);
        setError("Ảnh này đã tồn tại trong slider");
        setUploading(false);
        return;
      }

      // Giới hạn số lượng ảnh
      const MAX_SLIDER_IMAGES = 10;
      if (validExistingImages.length >= MAX_SLIDER_IMAGES) {
        setError(`Chỉ có thể upload tối đa ${MAX_SLIDER_IMAGES} ảnh slider`);
        setUploading(false);
        return;
      }

      // Tạo mảng mới
      const updatedImages = [...validExistingImages, downloadURL];

      // 🎯 ĐẢM BẢO KHÔNG CÓ DUPLICATE
      const uniqueImages = [...new Set(updatedImages)];

      if (uniqueImages.length !== updatedImages.length) {
        console.error("❌ Có duplicate trong updatedImages!");
      }

      // 🎯 THÊM DELAY để tránh race condition
      await new Promise((resolve) => setTimeout(resolve, 200));

      await saveSliderImages(uniqueImages);

      // 🎯 THÊM DELAY sau khi save
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (onUploadSuccess) {
        onUploadSuccess(downloadURL, uniqueImages);
      }

      alert("✅ Upload ảnh slider thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi upload ảnh slider:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // 🎯 SỬA handleDeleteImage - THÊM DELAY
  const handleDeleteImage = async (index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi slider?")) {
      return;
    }

    try {
      // Xóa ảnh
      const updatedImages = validExistingImages.filter((_, i) => i !== index);

      // 🎯 THÊM DELAY
      await new Promise((resolve) => setTimeout(resolve, 200));

      await saveSliderImages(updatedImages);

      // 🎯 THÊM DELAY
      await new Promise((resolve) => setTimeout(resolve, 200));

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
      // Sắp xếp indices giảm dần để xóa từ cuối lên
      const sortedIndices = [...imagesToDelete].sort((a, b) => b - a);

      let updatedImages = [...validExistingImages];
      sortedIndices.forEach((index) => {
        updatedImages = updatedImages.filter((_, i) => i !== index);
      });

      // 🎯 THÊM DELAY
      await new Promise((resolve) => setTimeout(resolve, 200));

      await saveSliderImages(updatedImages);

      // 🎯 THÊM DELAY
      await new Promise((resolve) => setTimeout(resolve, 200));

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
    setImagesToDelete((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input để có thể chọn lại file cùng tên
    event.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleMultipleUpload = async (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Lọc file hợp lệ
    const validFiles = fileArray.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      setError("Không có file ảnh hợp lệ");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const MAX_SLIDER_IMAGES = 10;
      const availableSlots = MAX_SLIDER_IMAGES - validExistingImages.length;

      if (availableSlots <= 0) {
        setError(`Đã đạt giới hạn ${MAX_SLIDER_IMAGES} ảnh slider`);
        setUploading(false);
        return;
      }

      const filesToUpload = validFiles.slice(0, availableSlots);

      // Upload song song để tăng tốc độ
      const uploadPromises = filesToUpload.map(async (file) => {
        try {
          const downloadURL = await uploadToCloudinary(file);
          return downloadURL;
        } catch (error) {
          console.error("Lỗi upload file:", file.name, error);
          return null;
        }
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(
        (url) => url && !isDuplicateImage(url, validExistingImages)
      );

      if (uploadedUrls.length > 0) {
        const updatedImages = [...validExistingImages, ...uploadedUrls];
        await saveSliderImages(updatedImages);

        // Cập nhật local state
        if (onUploadSuccess) {
          onUploadSuccess(null, updatedImages);
        }

        alert(`✅ Đã upload thành công ${uploadedUrls.length} ảnh!`);
      } else {
        setError("Không có ảnh nào được upload thành công");
      }
    } catch (error) {
      console.error("❌ Lỗi khi upload nhiều ảnh:", error);
      setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultipleUpload(files);
    }
  };

  // Hàm xóa tất cả ảnh null từ Firebase (tùy chọn)
  // const handleCleanupNullImages = async () => {
  //   if (!window.confirm("Xóa tất cả ảnh null/trống khỏi slider?")) return;

  //   try {
  //     await saveSliderImages(validExistingImages);
  //     alert("✅ Đã dọn dẹp ảnh null thành công!");
  //     if (onUploadSuccess) {
  //       onUploadSuccess(null, validExistingImages);
  //     }
  //   } catch (error) {
  //     console.error("Lỗi khi dọn dẹp ảnh null:", error);
  //     alert("❌ Lỗi khi dọn dẹp ảnh null");
  //   }
  // };

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <div className="header-left">
          <h3>Quản Lý Slider</h3>
          {/* {existingImages.length > validExistingImages.length && (
            <button
              className="cleanup-btn"
              onClick={handleCleanupNullImages}
              title="Xóa ảnh null/trống"
            >
              🧹 Dọn dẹp ({existingImages.length - validExistingImages.length})
            </button>
          )} */}
        </div>
        {/* {imagesToDelete.length > 0 && (
          <button
            className="delete-multiple-btn"
            onClick={handleMultipleDelete}
          >
            🗑️ Xóa ({imagesToDelete.length})
          </button>
        )} */}
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

      {/* 🎯 SỬA: Thêm unique key với hash để tránh React duplicate key warning */}
      {validExistingImages.length > 0 && (
        <div className="current-images">
          <div className="images-header">
            <h4>
              Ảnh slider hiện tại ({validExistingImages.length}/10)
              {/* {existingImages.length !== validExistingImages.length && (
                <span className="warning-count">
                  ({existingImages.length - validExistingImages.length} ảnh
                  null/trùng)
                </span>
              )} */}
              {imagesToDelete.length > 0 && (
                <span className="selected-count">
                  - Đã chọn: {imagesToDelete.length}
                </span>
              )}
            </h4>
          </div>

          <div className="images-grid">
            {validExistingImages.map((image, index) => {
              // 🎯 TẠO UNIQUE KEY với index và image hash
              const imageHash = image
                ? image.substring(image.length - 20)
                : "null";
              const uniqueKey = `image-${index}-${imageHash}`;

              return (
                <div
                  key={uniqueKey}
                  className={`image-item ${
                    imagesToDelete.includes(index) ? "selected" : ""
                  }`}
                  onClick={() => toggleImageSelection(index)}
                >
                  <div className="image-checkbox">
                    <input
                      type="checkbox"
                      checked={imagesToDelete.includes(index)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleImageSelection(index);
                      }}
                    />
                  </div>
                  <img
                    src={image}
                    alt={`Slider ${index + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      console.error(`Lỗi tải ảnh ${index}:`, image);
                      e.target.style.display = "none";
                      e.target.parentNode.querySelector(
                        ".image-error"
                      ).style.display = "block";
                    }}
                  />
                  <div className="image-error" style={{ display: "none" }}>
                    ❌ Lỗi tải ảnh
                  </div>
                  <div className="image-info">
                    <span className="image-number">Ảnh {index + 1}</span>
                    <button
                      className="delete-btn single"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(index);
                      }}
                      title="Xóa ảnh này"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {imagesToDelete.length > 1 && (
            <button
              className="delete-multiple-btn"
              onClick={handleMultipleDelete}
            >
              🗑️ Xóa ({imagesToDelete.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SliderImageUploader;
