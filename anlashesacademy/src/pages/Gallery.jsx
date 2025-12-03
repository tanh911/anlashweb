import React, { useState, useEffect } from "react";
import FolderUploader from "../component/FolderImageUploader";
import {
  getFolders,
  saveFolders,
  getImagesByFolder,
  saveImageToFolder,
} from "../firebase/firestore";
import "./Gallery.css";

const Gallery = ({ loggedIn }) => {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);

  // Load folders khi component mount
  useEffect(() => {
    console.log("Loading folders for all users...");
    setLoading(true);
    loadFolders();
  }, []);

  const loadFolders = async () => {
    console.log("Loading folders...");
    try {
      const foldersData = await getFolders();
      console.log("Folders loaded:", foldersData);

      setFolders(foldersData || []);

      if (foldersData && foldersData.length > 0) {
        const firstFolder = foldersData[0];
        setCurrentFolder(firstFolder.id);
        loadImages(firstFolder.id);
      } else {
        setCurrentFolder(null);
        setImages([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi load folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (folderId) => {
    console.log("Loading images for folder:", folderId);
    try {
      const folderImages = await getImagesByFolder(folderId);
      setImages(folderImages || []);
      setSelectedImages([]); // Reset selection khi chuyển folder
    } catch (error) {
      console.error("❌ Lỗi khi load images:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Vui lòng nhập tên folder");
      return;
    }

    if (!loggedIn) {
      alert("Vui lòng đăng nhập để tạo folder!");
      return;
    }

    try {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 0,
      };

      const updatedFolders = [...folders, newFolder];
      await saveFolders(updatedFolders);

      setFolders(updatedFolders);
      setNewFolderName("");
      setShowCreateFolder(false);

      // Chọn folder mới tạo
      setCurrentFolder(newFolder.id);
      setImages([]);

      alert(`✅ Đã tạo folder "${newFolderName}" thành công!`);
    } catch (error) {
      console.error("❌ Lỗi khi tạo folder:", error);
      alert("Lỗi khi tạo folder: " + error.message);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editFolderName.trim()) {
      alert("Vui lòng nhập tên folder mới");
      return;
    }

    if (!loggedIn) {
      alert("Vui lòng đăng nhập để đổi tên folder!");
      return;
    }

    try {
      const updatedFolders = folders.map((folder) =>
        folder.id === editingFolder
          ? {
              ...folder,
              name: editFolderName,
              updatedAt: new Date().toISOString(),
            }
          : folder
      );

      await saveFolders(updatedFolders);
      setFolders(updatedFolders);
      setEditingFolder(null);
      setEditFolderName("");

      alert(`✅ Đã đổi tên folder thành "${editFolderName}"!`);
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật folder:", error);
      alert("Lỗi khi cập nhật folder: " + error.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!loggedIn) {
      alert("Vui lòng đăng nhập để xóa folder!");
      return;
    }

    const folderToDelete = folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;

    if (
      !window.confirm(`Bạn có chắc muốn xóa folder "${folderToDelete.name}"?`)
    ) {
      return;
    }

    try {
      const updatedFolders = folders.filter((folder) => folder.id !== folderId);
      await saveFolders(updatedFolders);

      setFolders(updatedFolders);

      if (currentFolder === folderId) {
        if (updatedFolders.length > 0) {
          setCurrentFolder(updatedFolders[0].id);
          loadImages(updatedFolders[0].id);
        } else {
          setCurrentFolder(null);
          setImages([]);
        }
      }

      alert(`✅ Đã xóa folder "${folderToDelete.name}"!`);
    } catch (error) {
      console.error("❌ Lỗi khi xóa folder:", error);
      alert("Lỗi khi xóa folder: " + error.message);
    }
  };

  const handleFolderUploadSuccess = async (url, folderId) => {
    console.log("Upload success:", url, "for folder:", folderId);

    if (!loggedIn) {
      alert("Vui lòng đăng nhập để upload ảnh!");
      return;
    }

    try {
      await saveImageToFolder(folderId, url);

      if (currentFolder === folderId) {
        setImages((prev) => [...prev, url]);
      }

      alert("✅ Upload ảnh thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi lưu ảnh:", error);
      alert("Lỗi khi lưu ảnh: " + error.message);
    }
  };

  const toggleImageSelection = (imageIndex) => {
    setSelectedImages((prev) =>
      prev.includes(imageIndex)
        ? prev.filter((index) => index !== imageIndex)
        : [...prev, imageIndex]
    );
  };

  const getCurrentFolder = () => {
    return folders.find((f) => f.id === currentFolder);
  };

  const handleSelectAllImages = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map((_, index) => index));
    }
  };

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const currentFolderData = getCurrentFolder();

  return (
    <div className="gallery-container">
      {/* Header */}
      <div className="gallery-header">
        <div className="header-left">
          <div className="gallery-logo">
            <span className="logo-icon">📷</span>
            <span className="logo-text">Bộ Sưu Tập</span>
          </div>
        </div>
      </div>

      <div className="gallery-layout">
        {/* Sidebar - Danh sách folders */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">📁 Thư mục</h2>
          </div>

          <div className="folders-list">
            {folders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <div className="empty-title">Chưa có thư mục</div>
                {loggedIn && (
                  <div className="empty-description">
                    Tạo thư mục đầu tiên để bắt đầu
                  </div>
                )}
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`folder-item ${
                    currentFolder === folder.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setCurrentFolder(folder.id);
                    loadImages(folder.id);
                  }}
                >
                  <span className="folder-icon">
                    {currentFolder === folder.id ? "📂" : "📁"}
                  </span>
                  <div className="folder-info">
                    <div className="folder-name">{folder.name}</div>
                    <div className="folder-stats">
                      {folder.itemCount || 0} ảnh
                    </div>
                  </div>
                  {loggedIn && (
                    <div className="folder-actions">
                      <button
                        className="btn icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder.id);
                          setEditFolderName(folder.name);
                        }}
                        title="Đổi tên"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {loggedIn && (
            <div style={{ padding: "16px", borderTop: "1px solid #dadce0" }}>
              <button
                className="btn primary"
                onClick={() => setShowCreateFolder(true)}
                style={{ width: "100%" }}
              >
                ➕ Tạo thư mục mới
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Folder Details */}
          <div className="folder-details">
            <div className="folder-details-header">
              <h2 className="folder-details-title">
                <span className="folder-details-icon">
                  {currentFolder ? "📂" : "🏠"}
                </span>
                {currentFolder
                  ? currentFolderData?.name || "Đang tải..."
                  : "Chọn một thư mục"}
              </h2>

              {currentFolder && loggedIn && (
                <div className="folder-actions-row">
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setEditingFolder(currentFolder);
                      setEditFolderName(currentFolderData?.name || "");
                    }}
                  >
                    ✏️ Đổi tên
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => handleDeleteFolder(currentFolder)}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              )}
            </div>

            {loggedIn && currentFolder && currentFolderData && (
              <div className="folder-meta">
                <div className="meta-item">
                  <span className="meta-label">Số lượng ảnh</span>
                  <span className="meta-value">{images.length} ảnh</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Ngày tạo</span>
                  <span className="meta-value">
                    {new Date(currentFolderData.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cập nhật lần cuối</span>
                  <span className="meta-value">
                    {new Date(currentFolderData.updatedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </div>
            )}

            {currentFolder && loggedIn && (
              <div style={{ marginTop: "20px" }}>
                <FolderUploader
                  loggedIn={loggedIn}
                  onUploadSuccess={(url) =>
                    handleFolderUploadSuccess(url, currentFolder)
                  }
                  folderId={currentFolder}
                  buttonText="Upload ảnh"
                />
              </div>
            )}
          </div>

          {/* Images Preview */}
          <div className="images-preview">
            <div className="preview-header">
              <h3 className="preview-title">
                🖼️ Ảnh
                {currentFolder && <span>({images.length} ảnh)</span>}
              </h3>

              {images.length > 0 && (
                <div className="preview-actions">
                  {selectedImages.length > 0 && (
                    <button
                      className="btn secondary"
                      onClick={() => {
                        alert(`Xóa ${selectedImages.length} ảnh?`);
                        setSelectedImages([]);
                      }}
                    >
                      🗑️ Xóa đã chọn ({selectedImages.length})
                    </button>
                  )}
                  {loggedIn && (
                    <button
                      className="btn secondary"
                      onClick={handleSelectAllImages}
                    >
                      {selectedImages.length === images.length
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="images-grid">
              {currentFolder ? (
                images.length > 0 ? (
                  images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`image-card ${
                        selectedImages.includes(idx) ? "selected" : ""
                      }`}
                      onClick={() => toggleImageSelection(idx)}
                    >
                      <img
                        src={img}
                        alt={`Ảnh ${idx + 1}`}
                        className="image-preview"
                        onDoubleClick={() => setModalImage(img)}
                      />
                      <div className="image-info">
                        <div className="image-name">Ảnh {idx + 1}</div>
                        <div className="image-size">1.2 MB</div>
                      </div>
                      <div className="image-overlay">
                        <button
                          className="btn icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalImage(img);
                          }}
                          title="Xem ảnh"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🖼️</div>
                    <div className="empty-title">Chưa có ảnh</div>
                    <div className="empty-description">
                      {loggedIn
                        ? "Upload ảnh đầu tiên vào thư mục này"
                        : "Đăng nhập để upload ảnh"}
                    </div>
                  </div>
                )
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👈</div>
                  <div className="empty-title">Chọn một thư mục</div>
                  <div className="empty-description">
                    Chọn thư mục từ sidebar để xem ảnh
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateFolder && loggedIn && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateFolder(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tạo thư mục mới</div>
              <button
                className="modal-close"
                onClick={() => setShowCreateFolder(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên thư mục</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên thư mục..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setShowCreateFolder(false)}
              >
                Hủy
              </button>
              <button className="btn primary" onClick={handleCreateFolder}>
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {editingFolder && loggedIn && (
        <div className="modal-overlay" onClick={() => setEditingFolder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Đổi tên thư mục</div>
              <button
                className="modal-close"
                onClick={() => setEditingFolder(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên mới</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleUpdateFolder()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setEditingFolder(null)}
              >
                Hủy
              </button>
              <button className="btn primary" onClick={handleUpdateFolder}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {modalImage && (
        <div className="modal-overlay" onClick={() => setModalImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Xem ảnh</div>
              <button
                className="modal-close"
                onClick={() => setModalImage(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <img src={modalImage} alt="Full size" className="modal-image" />
            </div>
            <div className="modal-footer">
              <a
                href={modalImage}
                target="_blank"
                rel="noopener noreferrer"
                className="btn secondary"
              >
                🔗 Mở ảnh
              </a>
              <a href={modalImage} download className="btn primary">
                ⬇️ Tải về
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
