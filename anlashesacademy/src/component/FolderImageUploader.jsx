import React, { useState, useRef, useEffect, useCallback } from "react";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { saveImageToFolder } from "../firebase/firestore";
import "./FolderImageUploader.css";

const FolderImageUploader = ({
  loggedIn,
  onUploadSuccess,
  folderId,
  buttonText = "Upload ảnh",
  variant = "default",
  showFileName = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const fileInputRef = useRef(null);
  const isUploadingRef = useRef(false);
  const hasUploadedRef = useRef(false); // Track nếu đã upload thành công
  const uploadIdRef = useRef(null); // Unique ID cho mỗi lần upload

  useEffect(() => {
    return () => {
      isUploadingRef.current = false;
      hasUploadedRef.current = false;
    };
  }, []);

  const handleFileUpload = useCallback(
    async (file) => {
      // Tạo unique ID cho lần upload này
      const uploadId =
        Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      uploadIdRef.current = uploadId;

      // Kiểm tra đang upload
      if (isUploadingRef.current) {
        return;
      }

      if (!file) return;

      // Validation
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh (JPEG, PNG, GIF)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB");
        return;
      }

      isUploadingRef.current = true;
      hasUploadedRef.current = false;

      // Reset input ngay lập tức
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setUploading(true);
      setError("");
      setFileName(file.name);

      try {
        // Upload lên Cloudinary
        const downloadURL = await uploadToCloudinary(file);

        // Lưu vào Firebase với folderId
        await saveImageToFolder(folderId, downloadURL);

        // Chỉ gọi onUploadSuccess nếu vẫn là cùng uploadId
        if (
          uploadIdRef.current === uploadId &&
          onUploadSuccess &&
          !hasUploadedRef.current
        ) {
          hasUploadedRef.current = true;
          onUploadSuccess(downloadURL, folderId);
        }

        // Alert với delay
        setTimeout(() => {
          if (uploadIdRef.current === uploadId) {
            alert("✅ Upload ảnh thành công!");
          }
        }, 100);
      } catch (error) {
        console.error(`[${uploadId}] Lỗi khi upload ảnh:`, error);
        setError("Lỗi khi upload ảnh. Vui lòng thử lại.");
      } finally {
        // Chỉ reset nếu vẫn là cùng uploadId
        if (uploadIdRef.current === uploadId) {
          setUploading(false);
          setFileName("");
          isUploadingRef.current = false;

          // Reset input sau khi upload xong
          setTimeout(() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }, 300);
        }
      }
    },
    [folderId, onUploadSuccess]
  );

  const handleFileInputChange = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file) {
        handleFileUpload(file);
      }
      // Không reset ở đây nữa, reset trong handleFileUpload
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("drag-over");

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!loggedIn || !folderId) {
    return null;
  }

  return (
    <div className="folder-uploader">
      <label
        className={`upload-button ${variant} ${uploading ? "uploading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={uploading}
          className="file-input"
          key={`file-input-${Date.now()}`} // Force re-mount
        />

        {uploading ? (
          <div className="uploading-spinner">Đang upload...</div>
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

export default React.memo(FolderImageUploader);
