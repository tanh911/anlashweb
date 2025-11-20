import React, { useState, useEffect, useRef } from "react";
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
  useEffect(() => {
    const unsubscribe = listenToSliderImages((images) => {
      if (images && Array.isArray(images)) {
        const mapped = images.map((url, idx) => ({
          id: idx + 1,
          image: url,
        }));
        setSlides(mapped);
        setCurrentIndex(0);
      } else {
        console.log("❌ Images không tồn tại hoặc không phải array");
      }
    });

    return unsubscribe;
  }, []);

  // Lấy dữ liệu realtime - FIX: Thêm error handling
  useEffect(() => {
    try {
      const unsubscribe = listenToSliderImages((images) => {
        if (images && Array.isArray(images)) {
          const mapped = images.map((url, idx) => ({
            id: idx + 1,
            image: url,
          }));
          setSlides(mapped);
          // Reset currentIndex khi slides thay đổi
          setCurrentIndex(0);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error("Lỗi khi lấy slider images:", error);
    }
  }, []);

  // Auto slide - FIX: Clear timeout properly
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isPaused, slides.length]);

  // const nextSlide = () => {
  //   setCurrentIndex((prev) => (prev + 1) % slides.length);
  // };

  // const prevSlide = () => {
  //   setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  // };

  const deleteSlide = async (id) => {
    if (!loggedIn || !window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      const newSlides = slides.filter((s) => s.id !== id);
      const imageUrls = newSlides.map((s) => s.image);
      await saveSliderImages(imageUrls);
    } catch (error) {
      console.error("Lỗi khi xóa slide:", error);
      alert("Lỗi khi xóa ảnh");
    }
  };

  // Mở modal xem ảnh to
  const openImageModal = (imageUrl, index) => {
    setModalImage(imageUrl);
    setCurrentIndex(index); // Set đúng index khi click
    setShowModal(true);
  };

  // Đóng modal
  const closeImageModal = () => {
    setShowModal(false);
  };

  // Chuyển ảnh trong modal
  const nextImageModal = () => {
    const nextIndex = (currentIndex + 1) % slides.length;
    setCurrentIndex(nextIndex);
    setModalImage(slides[nextIndex]?.image);
  };

  const prevImageModal = () => {
    const prevIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setModalImage(slides[prevIndex]?.image);
  };

  // Đóng modal khi click ra ngoài
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showModal) return;

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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal, currentIndex, slides.length]);

  // FIX: Thêm check slides rỗng
  if (!slides || slides.length === 0) {
    return (
      <div className="slider-wrapper">
        <div className="no-slides">
          <p>Chưa có ảnh nào trong slider</p>
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
                <div key={slide.id} className="slide">
                  <div
                    className="slide-image"
                    style={{ backgroundImage: `url(${slide.image})` }}
                    onClick={() => openImageModal(slide.image, index)}
                  >
                    {loggedIn && (
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slide.id);
                        }}
                      >
                        ✕
                      </button>
                    )}
                    {/* Hiệu ứng click để xem ảnh to */}
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
        <div></div>

        {/* Dots indicator */}

        {slides.length > 1 && (
          <div className="dots-container">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal xem ảnh to */}
      {showModal && (
        <div className="image-modal" onClick={handleBackdropClick}>
          <div className="modal-content">
            <button className="modal-close-btn" onClick={closeImageModal}>
              ✕
            </button>

            <div className="modal-image-container">
              <img src={modalImage} alt="Xem to" className="modal-image" />

              {/* Navigation trong modal */}
              {slides.length > 1 && (
                <>
                  <button
                    className="modal-nav-btn modal-prev-btn"
                    onClick={prevImageModal}
                  >
                    ‹
                  </button>
                  <button
                    className="modal-nav-btn modal-next-btn"
                    onClick={nextImageModal}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Counter */}
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
