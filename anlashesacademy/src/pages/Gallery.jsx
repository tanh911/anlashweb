import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import FolderUploader from "../component/FolderImageUploader";
import {
  getFolders,
  saveFolders,
  getImagesByFolder,
  saveImageToFolder,
  deleteMultipleImages,
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
  const [folderImageCounts, setFolderImageCounts] = useState({});
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  // Refs
  const lastUploadTime = useRef(0);
  const isProcessingUpload = useRef(false);
  const abortControllerRef = useRef(null);
  const toggleSelectionMode = () => {
    if (!loggedIn) {
      alert("Vui lòng đăng nhập để chọn ảnh!");
      return;
    }
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Nếu đang tắt chế độ chọn, xóa tất cả selection
      setSelectedImages([]);
    }
  };
  // Lấy thông tin folder hiện tại
  const currentFolderData = useMemo(
    () => folders.find((f) => f.id === currentFolder),
    [folders, currentFolder]
  );

  // Load folders khi component mount
  useEffect(() => {
    setLoading(true);
    loadFolders();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load số lượng ảnh cho mỗi folder
  useEffect(() => {
    const loadFolderImageCounts = async () => {
      if (folders.length === 0) return;

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const counts = {};
        const promises = folders.map(async (folder) => {
          try {
            const images = await getImagesByFolder(folder.id);
            if (!controller.signal.aborted) {
              counts[folder.id] = images.length;
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              console.error(`Lỗi khi lấy ảnh cho folder ${folder.id}:`, error);
              counts[folder.id] = 0;
            }
          }
        });

        await Promise.all(promises);

        if (!controller.signal.aborted) {
          setFolderImageCounts(counts);
        }
      } catch (error) {
        console.error("Lỗi khi lấy số ảnh folder:", error);
      }
    };

    loadFolderImageCounts();
  }, [folders]);

  const loadFolders = useCallback(async () => {
    try {
      const foldersData = await getFolders();
      const validFolders = Array.isArray(foldersData) ? foldersData : [];
      setFolders(validFolders);

      if (validFolders.length > 0) {
        setCurrentFolder(validFolders[0].id);
        loadImages(validFolders[0].id);
      } else {
        setCurrentFolder(null);
        setImages([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi load folders:", error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadImages = useCallback(async (folderId) => {
    if (!folderId) {
      setImages([]);
      return;
    }

    setIsLoadingImages(true);
    try {
      const folderImages = await getImagesByFolder(folderId);
      setImages(Array.isArray(folderImages) ? folderImages : []);
      setSelectedImages([]);
    } catch (error) {
      console.error("❌ Lỗi khi load images:", error);
      setImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  // Xử lý touch events cho mobile
  const handleTouchStart = (e, img, idx) => {
    if (isDeleting) return;

    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      img,
      idx,
      timestamp: Date.now(),
    });
  };

  const handleTouchEnd = (e, idx) => {
    if (!touchStart || isDeleting) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const distance = Math.sqrt(
      Math.pow(touchEnd.x - touchStart.x, 2) +
        Math.pow(touchEnd.y - touchStart.y, 2)
    );

    const timeDiff = Date.now() - touchStart.timestamp;

    // Nếu là tap (di chuyển ít và thời gian ngắn)
    if (distance < 10 && timeDiff < 300) {
      if (selectionMode && loggedIn) {
        // Trong chế độ chọn, tap để chọn ảnh
        toggleImageSelection(idx);
      } else {
        // Không trong chế độ chọn, tap để xem ảnh
        setModalImage(touchStart.img);
      }
    }

    setTouchStart(null);
  };

  const handleImageClick = (img, idx) => {
    if (isDeleting) return;

    if (selectionMode && loggedIn) {
      // Trong chế độ chọn, click để chọn/bỏ chọn ảnh
      toggleImageSelection(idx);
    } else if (!selectionMode && loggedIn) {
      // Nếu không trong chế độ chọn, click để xem ảnh
      setModalImage(img);
    } else {
      // Nếu không đăng nhập, click để xem ảnh
      setModalImage(img);
    }
  };

  // const handleImageDoubleClick = (img) => {
  //   if (isDeleting) return;
  //   setModalImage(img);
  // };

  // Thêm long press để xem ảnh trên mobile (cho người dùng đã đăng nhập)
  useEffect(() => {
    let pressTimer;

    if (touchStart && loggedIn && !isDeleting) {
      pressTimer = setTimeout(() => {
        // Long press (giữ 1 giây) để xem ảnh
        setModalImage(touchStart.img);
        setTouchStart(null);
      }, 1000);
    }

    return () => {
      if (pressTimer) clearTimeout(pressTimer);
    };
  }, [touchStart, loggedIn, isDeleting]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Vui lòng nhập tên folder");
      return;
    }

    if (!loggedIn) {
      alert("Vui lòng đăng nhập để tạo folder!");
      return;
    }

    const isDuplicate = folders.some(
      (folder) =>
        folder.name.toLowerCase() === newFolderName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên folder đã tồn tại. Vui lòng chọn tên khác.");
      return;
    }

    try {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedFolders = [...folders, newFolder];
      await saveFolders(updatedFolders);

      setFolders(updatedFolders);
      setNewFolderName("");
      setShowCreateFolder(false);
      setCurrentFolder(newFolder.id);
      setImages([]);
      setFolderImageCounts((prev) => ({
        ...prev,
        [newFolder.id]: 0,
      }));

      showNotification(`✅ Đã tạo folder "${newFolderName}" thành công!`);
    } catch (error) {
      console.error("❌ Lỗi khi tạo folder:", error);
      showNotification("❌ Lỗi khi tạo folder: " + error.message, true);
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

    const isDuplicate = folders.some(
      (folder) =>
        folder.id !== editingFolder &&
        folder.name.toLowerCase() === editFolderName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên folder đã tồn tại. Vui lòng chọn tên khác.");
      return;
    }

    try {
      const updatedFolders = folders.map((folder) =>
        folder.id === editingFolder
          ? {
              ...folder,
              name: editFolderName.trim(),
              updatedAt: new Date().toISOString(),
            }
          : folder
      );

      await saveFolders(updatedFolders);
      setFolders(updatedFolders);
      setEditingFolder(null);
      setEditFolderName("");

      showNotification(`✅ Đã đổi tên folder thành "${editFolderName}"!`);
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật folder:", error);
      showNotification("❌ Lỗi khi cập nhật folder: " + error.message, true);
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
      !window.confirm(
        `Bạn có chắc muốn xóa folder "${folderToDelete.name}" và tất cả ảnh bên trong?`
      )
    ) {
      return;
    }

    try {
      const updatedFolders = folders.filter((folder) => folder.id !== folderId);
      await saveFolders(updatedFolders);

      setFolders(updatedFolders);
      setFolderImageCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[folderId];
        return newCounts;
      });

      if (currentFolder === folderId) {
        if (updatedFolders.length > 0) {
          setCurrentFolder(updatedFolders[0].id);
          loadImages(updatedFolders[0].id);
        } else {
          setCurrentFolder(null);
          setImages([]);
        }
      }

      showNotification(`✅ Đã xóa folder "${folderToDelete.name}"!`);
    } catch (error) {
      console.error("❌ Lỗi khi xóa folder:", error);
      showNotification("❌ Lỗi khi xóa folder: " + error.message, true);
    }
  };

  const handleFolderUploadSuccess = useCallback(
    async (url, folderId) => {
      const now = Date.now();
      if (now - lastUploadTime.current < 1000 || isProcessingUpload.current) {
        console.log("Bỏ qua upload trùng lặp");
        return;
      }

      if (!loggedIn) {
        alert("Vui lòng đăng nhập để upload ảnh!");
        return;
      }

      if (!url || !folderId) {
        console.error("URL hoặc folderId không hợp lệ");
        return;
      }

      isProcessingUpload.current = true;
      lastUploadTime.current = now;

      try {
        await saveImageToFolder(folderId, url);

        if (currentFolder === folderId) {
          setImages((prev) => [...prev, url]);
        }

        setFolderImageCounts((prev) => ({
          ...prev,
          [folderId]: (prev[folderId] || 0) + 1,
        }));

        showNotification("✅ Upload ảnh thành công!");
      } catch (error) {
        console.error("❌ Lỗi khi lưu ảnh:", error);
        showNotification("❌ Lỗi khi lưu ảnh: " + error.message, true);
      } finally {
        isProcessingUpload.current = false;
      }
    },
    [loggedIn, currentFolder]
  );

  const toggleImageSelection = (imageIndex) => {
    if (isDeleting) return;

    setSelectedImages((prev) =>
      prev.includes(imageIndex)
        ? prev.filter((index) => index !== imageIndex)
        : [...prev, imageIndex]
    );
  };

  const handleSelectAllImages = () => {
    if (isDeleting || images.length === 0) return;

    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map((_, index) => index));
    }
  };

  const handleFolderSelect = (folderId) => {
    if (folderId === currentFolder) return;

    setCurrentFolder(folderId);
    loadImages(folderId);
  };

  const getFolderImageCount = (folderId) => {
    return folderImageCounts[folderId] || 0;
  };

  // const handleDeleteSingleImage = useCallback(
  //   async (imageIndex) => {
  //     if (!loggedIn) {
  //       alert("Vui lòng đăng nhập để xóa ảnh!");
  //       return;
  //     }

  //     if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) {
  //       return;
  //     }

  //     setIsDeleting(true);

  //     try {
  //       await deleteImageFromFolder(currentFolder, imageIndex);

  //       setImages((prev) => prev.filter((_, index) => index !== imageIndex));
  //       setFolderImageCounts((prev) => ({
  //         ...prev,
  //         [currentFolder]: Math.max((prev[currentFolder] || 0) - 1, 0),
  //       }));
  //       setSelectedImages((prev) => prev.filter((idx) => idx !== imageIndex));

  //       showNotification("✅ Đã xóa ảnh thành công!");
  //     } catch (error) {
  //       console.error("❌ Lỗi khi xóa ảnh:", error);
  //       showNotification("❌ Lỗi khi xóa ảnh. Vui lòng thử lại.", true);
  //     } finally {
  //       setIsDeleting(false);
  //     }
  //   },
  //   [currentFolder, loggedIn]
  // );

  const handleDeleteMultipleImages = useCallback(async () => {
    if (!loggedIn) {
      alert("Vui lòng đăng nhập để xóa ảnh!");
      return;
    }

    if (selectedImages.length === 0) {
      return;
    }

    setIsDeleting(true);

    try {
      const sortedSelectedImages = [...selectedImages].sort((a, b) => b - a);
      await deleteMultipleImages(currentFolder, sortedSelectedImages);

      setImages((prev) =>
        prev.filter((_, index) => !selectedImages.includes(index))
      );
      setFolderImageCounts((prev) => ({
        ...prev,
        [currentFolder]: (prev[currentFolder] || 0) - selectedImages.length,
      }));
      setSelectedImages([]);

      showNotification(`✅ Đã xóa ${selectedImages.length} ảnh thành công!`);
    } catch (error) {
      console.error("❌ Lỗi khi xóa ảnh:", error);
      showNotification("❌ Lỗi khi xóa ảnh. Vui lòng thử lại.", true);
    } finally {
      setIsDeleting(false);
    }
  }, [currentFolder, loggedIn, selectedImages]);

  // eslint-disable-next-line no-unused-vars
  const showNotification = (message, isError = false) => {
    setUploadSuccessMessage(message);
    setShowUploadSuccess(true);

    setTimeout(() => {
      setShowUploadSuccess(false);
    }, 3000);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return error;
    }
  };

  // Đóng modal khi chạm vào overlay trên mobile
  const handleModalOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setModalImage(null);
      setShowCreateFolder(false);
      setEditingFolder(null);
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

  return (
    <div className="gallery-container">
      {/* Notification Toast */}
      {showUploadSuccess && (
        <div
          className={`notification-toast ${
            uploadSuccessMessage.includes("❌") ? "error" : ""
          }`}
        >
          <div className="toast-content">
            <span className="toast-icon">
              {uploadSuccessMessage.includes("❌") ? "❌" : "✅"}
            </span>
            <span className="toast-message">{uploadSuccessMessage}</span>
            <button
              className="toast-close"
              onClick={() => setShowUploadSuccess(false)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="gallery-header">
        <div className="header-left">
          <div className="gallery-logo">
            <span className="logo-icon" aria-hidden="true">
              📷
            </span>
            <span
              className="logo-text"
              style={{
                fontFamily: "'Kavoon', serif",
                letterSpacing: "0.5px",
              }}
            >
              Bộ Sưu Tập
            </span>
          </div>
        </div>
      </div>

      <div className="gallery-layout">
        {/* Sidebar - Danh sách folders */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title" id="folders-title">
              <span aria-hidden="true">📁</span> Thư mục
            </h2>
          </div>
          <div
            className="folders-list"
            role="listbox"
            aria-labelledby="folders-title"
          >
            {folders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">
                  📁
                </div>
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
                  onClick={() => handleFolderSelect(folder.id)}
                  onTouchStart={(e) => e.stopPropagation()}
                  role="option"
                  aria-selected={currentFolder === folder.id}
                  tabIndex={0}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleFolderSelect(folder.id)
                  }
                >
                  <span className="folder-icon" aria-hidden="true">
                    {currentFolder === folder.id ? "📂" : "📁"}
                  </span>
                  <div className="folder-info">
                    <div className="folder-name">{folder.name}</div>
                    <div className="folder-stats">
                      {getFolderImageCount(folder.id)} ảnh
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
                        aria-label={`Đổi tên folder ${folder.name}`}
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
                aria-label="Tạo thư mục mới"
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
                <span className="folder-details-icon" aria-hidden="true">
                  {currentFolder ? "📂" : "🏠"}
                </span>
                {currentFolderData?.name || "Chọn một thư mục"}
              </h2>

              {currentFolder && loggedIn && (
                <div className="folder-actions-row">
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setEditingFolder(currentFolder);
                      setEditFolderName(currentFolderData?.name || "");
                    }}
                    aria-label="Đổi tên folder"
                  >
                    ✏️ Đổi tên
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => handleDeleteFolder(currentFolder)}
                    aria-label="Xóa folder"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              )}
            </div>

            {loggedIn && currentFolderData && (
              <div className="folder-meta">
                <div className="meta-item">
                  <span className="meta-label">Số lượng ảnh</span>
                  <span className="meta-value">
                    {getFolderImageCount(currentFolder)} ảnh
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Ngày tạo</span>
                  <span className="meta-value">
                    {formatDate(currentFolderData.createdAt)}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cập nhật lần cuối</span>
                  <span className="meta-value">
                    {formatDate(currentFolderData.updatedAt)}
                  </span>
                </div>
              </div>
            )}

            {currentFolder && loggedIn && (
              <div style={{ marginTop: "20px" }}>
                <FolderUploader
                  loggedIn={loggedIn}
                  onUploadSuccess={(url) => {
                    handleFolderUploadSuccess(url, currentFolder);
                  }}
                  folderId={currentFolder}
                  buttonText="Upload ảnh"
                  disabled={isDeleting}
                />
              </div>
            )}
          </div>

          {/* Images Preview */}
          <div className="images-preview">
            <div className="preview-header">
              <h3 className="preview-title">
                <span aria-hidden="true">🖼️</span> Ảnh
                {currentFolder && <span> ({images.length} ảnh)</span>}
              </h3>

              {images.length > 0 && loggedIn && (
                <div className="preview-actions">
                  {loggedIn && currentFolder && images.length > 0 && (
                    <button
                      className={`btn ${
                        selectionMode ? "primary" : "secondary"
                      }`}
                      onClick={toggleSelectionMode}
                      disabled={isDeleting}
                      aria-label={
                        selectionMode ? "Thoát chế độ chọn" : "Chọn ảnh"
                      }
                    >
                      {selectionMode ? (
                        <>
                          <span className="selection-mode-icon">✕</span>
                          Thoát chọn
                        </>
                      ) : (
                        <>
                          <span className="selection-mode-icon">✓</span>
                          Chọn ảnh
                        </>
                      )}
                    </button>
                  )}

                  {selectionMode && selectedImages.length > 0 && (
                    <button
                      className={`btn secondary ${
                        isDeleting ? "deleting" : ""
                      }`}
                      onClick={() => {
                        if (
                          window.confirm(`Xóa ${selectedImages.length} ảnh?`)
                        ) {
                          handleDeleteMultipleImages();
                        }
                      }}
                      disabled={isDeleting}
                      aria-label={`Xóa ${selectedImages.length} ảnh`}
                    >
                      {isDeleting ? (
                        <>
                          <span className="small-spinner"></span>
                          Đang xóa...
                        </>
                      ) : (
                        `🗑️ Xóa (${selectedImages.length})`
                      )}
                    </button>
                  )}

                  {selectionMode && (
                    <button
                      className="btn secondary"
                      onClick={handleSelectAllImages}
                      disabled={isDeleting || isLoadingImages}
                      aria-label={
                        selectedImages.length === images.length
                          ? "Bỏ chọn tất cả ảnh"
                          : "Chọn tất cả ảnh"
                      }
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
              {isLoadingImages ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Đang tải ảnh...</p>
                </div>
              ) : currentFolder ? (
                images.length > 0 ? (
                  images.map((img, idx) => (
                    <div
                      key={`${currentFolder}-${idx}`}
                      className={`image-card ${
                        selectionMode && selectedImages.includes(idx)
                          ? "selected"
                          : ""
                      } ${selectionMode ? "selectable" : ""} ${
                        isDeleting ? "disabled" : ""
                      }`}
                      onClick={() => handleImageClick(img, idx)}
                      onDoubleClick={() => {
                        if (!selectionMode) setModalImage(img);
                      }}
                      onTouchStart={(e) => handleTouchStart(e, img, idx)}
                      onTouchEnd={(e) => handleTouchEnd(e, idx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (loggedIn && !isDeleting) {
                          setModalImage(img);
                        }
                      }}
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleImageClick(img, idx);
                        }
                      }}
                      role="checkbox"
                      aria-checked={selectedImages.includes(idx)}
                      aria-label={`Ảnh ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Ảnh ${idx + 1} trong folder ${
                          currentFolderData?.name
                        }`}
                        className="image-preview"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x200?text=Lỗi+ảnh";
                        }}
                      />

                      {/* Thêm hint cho mobile */}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true">
                      🖼️
                    </div>
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
                  <div className="empty-icon" aria-hidden="true">
                    👈
                  </div>
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
          onClick={handleModalOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-folder-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" id="create-folder-title">
                Tạo thư mục mới
              </div>
              <button
                className="modal-close"
                onClick={() => setShowCreateFolder(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="new-folder-name">
                  Tên thư mục
                </label>
                <input
                  id="new-folder-name"
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên thư mục..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                  maxLength={50}
                />
                <div className="form-hint">Tối đa 50 ký tự</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setShowCreateFolder(false)}
                aria-label="Hủy tạo folder"
              >
                Hủy
              </button>
              <button
                className="btn primary"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                aria-label="Tạo thư mục"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {editingFolder && loggedIn && (
        <div
          className="modal-overlay"
          onClick={handleModalOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-folder-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" id="edit-folder-title">
                Đổi tên thư mục
              </div>
              <button
                className="modal-close"
                onClick={() => setEditingFolder(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-folder-name">
                  Tên mới
                </label>
                <input
                  id="edit-folder-name"
                  type="text"
                  className="form-input"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleUpdateFolder()}
                  maxLength={50}
                />
                <div className="form-hint">Tối đa 50 ký tự</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setEditingFolder(null)}
                aria-label="Hủy đổi tên folder"
              >
                Hủy
              </button>
              <button
                className="btn primary"
                onClick={handleUpdateFolder}
                disabled={!editFolderName.trim()}
                aria-label="Lưu tên mới"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {modalImage && (
        <div
          className="modal-overlay image-modal-overlay"
          onClick={handleModalOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div
            className="modal-content image-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" id="image-modal-title">
                Xem ảnh
              </div>
              <button
                className="modal-close"
                onClick={() => setModalImage(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="modal-body image-modal-body">
              <div className="image-modal-container">
                <img
                  src={modalImage}
                  alt="Xem ảnh đầy đủ"
                  className="modal-image"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/800x600?text=Lỗi+tải+ảnh";
                  }}
                />
              </div>
            </div>
            <div className="modal-footer image-modal-footer">
              <a
                href={modalImage}
                target="_blank"
                rel="noopener noreferrer"
                className="btn secondary"
                aria-label="Mở ảnh trong tab mới"
              >
                🔗 Mở ảnh
              </a>
              <a
                href={modalImage}
                download
                className="btn primary"
                aria-label="Tải ảnh về"
              >
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
