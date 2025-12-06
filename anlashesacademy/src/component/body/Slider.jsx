import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  listenToSliderImages,
  saveSliderImages,
} from "../../firebase/firestore";
import "./Slider.css";

export default function Slider({ loggedIn }) {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState("");

  const timeoutRef = useRef(null);
  const listenerRef = useRef(null);
  const isMountedRef = useRef(true);

  // 🎯 SIMPLE LISTENER với Global Listener Pattern
  useEffect(() => {
    isMountedRef.current = true;

    console.log("🎬 Slider component mounting...");
    if (listenerRef.current) {
      listenerRef.current();
    }

    // Setup listener đơn giản
    const unsubscribe = listenToSliderImages(
      (images) => {
        if (!isMountedRef.current) return;

        console.log("📥 Slider nhận images:", images?.length || 0);

        if (images && Array.isArray(images)) {
          const mapped = images.map((url, idx) => ({
            id: idx + 1,
            image: url,
          }));

          setSlides(mapped);
        } else {
          setSlides([]);
        }
      },
      "slider_component" // 🎯 QUAN TRỌNG: Dùng FIXED ID
    );

    listenerRef.current = unsubscribe;

    // Cleanup
    return () => {
      console.log("🧹 Slider component unmounting...");
      isMountedRef.current = false;

      if (listenerRef.current) {
        listenerRef.current();
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto slide
  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentIndex, isPaused, slides.length]);

  const deleteSlide = useCallback(
    async (id) => {
      if (!loggedIn || !window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;

      try {
        const newSlides = slides.filter((s) => s.id !== id);
        const imageUrls = newSlides.map((s) => s.image);
        await saveSliderImages(imageUrls);

        // 🎯 Không cần setSlides ở đây vì listener sẽ tự động update
        // Chỉ cần điều chỉnh currentIndex nếu cần
        if (currentIndex >= newSlides.length && newSlides.length > 0) {
          setCurrentIndex(newSlides.length - 1);
        } else if (newSlides.length === 0) {
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Lỗi khi xóa slide:", error);
        alert("Lỗi khi xóa ảnh");
      }
    },
    [loggedIn, slides, currentIndex]
  );

  const openImageModal = useCallback((imageUrl, index) => {
    setModalImage(imageUrl);
    setCurrentIndex(index);
    setShowModal(true);
    setIsPaused(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowModal(false);
    setIsPaused(false);
  }, []);

  const nextImageModal = useCallback(() => {
    if (slides.length <= 1) return;
    const nextIndex = (currentIndex + 1) % slides.length;
    setCurrentIndex(nextIndex);
    setModalImage(slides[nextIndex]?.image);
  }, [currentIndex, slides]);

  const prevImageModal = useCallback(() => {
    if (slides.length <= 1) return;
    const prevIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setModalImage(slides[prevIndex]?.image);
  }, [currentIndex, slides]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        closeImageModal();
      }
    },
    [closeImageModal]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showModal || !isMountedRef.current) return;

      switch (e.key) {
        case "Escape":
          closeImageModal();
          break;
        case "ArrowLeft":
          prevImageModal();
          break;
        case "ArrowRight":
          nextImageModal();
          break;
        default:
          break;
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, prevImageModal, nextImageModal, closeImageModal]);

  // Empty state
  if (!slides || slides.length === 0) {
    return (
      <div className="slider-wrapper">
        <div className="no-slides">
          <p>Chưa có ảnh nào trong slider</p>
          {loggedIn && (
            <p className="no-slides-hint">
              (Vui lòng thêm ảnh từ trang quản lý)
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="slider-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="slider-container">
          <div className="slider-viewport">
            <div
              className="slides-container"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={`slide-${slide.id}-${index}`} className="slide">
                  <div
                    className="slide-image"
                    style={{ backgroundImage: `url(${slide.image})` }}
                    onClick={() => openImageModal(slide.image, index)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Xem ảnh ${index + 1} to hơn`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openImageModal(slide.image, index);
                      }
                    }}
                  >
                    {loggedIn && (
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteSlide(slide.id);
                        }}
                        aria-label={`Xóa ảnh ${index + 1}`}
                      >
                        ✕
                      </button>
                    )}
                    <div className="zoom-overlay">
                      <span className="zoom-icon">🔍</span>
                      <span className="zoom-text">Click để xem ảnh to</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dots indicator */}
        {slides.length > 1 && (
          <div className="dots-container">
            {slides.map((_, index) => (
              <button
                key={`dot-${index}`}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Chuyển đến ảnh ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal xem ảnh to */}
      {showModal && (
        <div
          className="image-modal"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content">
            <button
              className="modal-close-btn"
              onClick={closeImageModal}
              aria-label="Đóng ảnh"
            >
              ✕
            </button>

            <div className="modal-image-container">
              <img
                src={modalImage}
                alt={`Ảnh ${currentIndex + 1} của ${slides.length}`}
                className="modal-image"
                id="modal-title"
              />

              {slides.length > 1 && (
                <>
                  <button
                    className="modal-nav-btn modal-prev-btn"
                    onClick={prevImageModal}
                    aria-label="Ảnh trước"
                  >
                    ‹
                  </button>
                  <button
                    className="modal-nav-btn modal-next-btn"
                    onClick={nextImageModal}
                    aria-label="Ảnh sau"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {slides.length > 1 && (
              <div className="image-counter">
                {currentIndex + 1} / {slides.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
