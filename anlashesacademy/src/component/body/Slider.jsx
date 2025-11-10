import React, { useState, useEffect, useRef } from "react";
import "./Slider.css";

export default function Slider({ loggedIn }) {
  const [slides, setSlides] = useState([
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1000&h=500&fit=crop",
      title: "Slide 1",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1000&h=500&fit=crop",
      title: "Slide 2",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=1000&h=500&fit=crop",
      title: "Slide 3",
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [newImage, setNewImage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);
  const slidesContainerRef = useRef(null);

  // Auto slide
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timeoutRef.current = setTimeout(() => {
      nextSlide();
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isPaused, slides.length]);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const addSlide = () => {
    if (!newImage.trim()) {
      alert("Vui lòng nhập URL ảnh!");
      return;
    }

    const newSlide = {
      id: Date.now(),
      image: newImage,
      title: newTitle || `Slide ${slides.length + 1}`,
    };

    setSlides([...slides, newSlide]);
    setNewImage("");
    setNewTitle("");
  };

  const deleteSlide = (id, e) => {
    e.stopPropagation();

    if (slides.length <= 1) {
      alert("Không thể xóa slide cuối cùng!");
      return;
    }

    const newSlides = slides.filter((slide) => slide.id !== id);
    setSlides(newSlides);

    if (currentIndex >= newSlides.length) {
      setCurrentIndex(newSlides.length - 1);
    }
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Debug
  useEffect(() => {}, [currentIndex, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="slider-container">
        <div className="empty-message">
          <p>Không có ảnh nào để hiển thị</p>
          {loggedIn && (
            <div className="admin-bar">
              <input
                type="text"
                placeholder="Nhập URL ảnh mới..."
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
              <input
                type="text"
                placeholder="Tiêu đề (tùy chọn)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button onClick={addSlide}>Thêm ảnh</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="slider-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="slider-container">
        <div className="slider">
          {/* QUAN TRỌNG: Thêm slider-viewport */}
          <div className="slider-viewport">
            <div
              ref={slidesContainerRef}
              className="slides-container"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {slides.map((slide) => (
                <div key={slide.id} className="slide">
                  <div
                    className="slide-image"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    {loggedIn && (
                      <button
                        className="btn-delete"
                        onClick={(e) => deleteSlide(slide.id, e)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          {slides.length > 1 && (
            <>
              <button className="nav-btn prev-btn" onClick={prevSlide}>
                ‹
              </button>
              <button className="nav-btn next-btn" onClick={nextSlide}>
                ›
              </button>
            </>
          )}

          {/* Indicators */}
          {slides.length > 1 && (
            <div className="slide-indicators">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${
                    index === currentIndex ? "active" : ""
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}

          {/* Slide counter */}
          <div className="slide-counter">
            {currentIndex + 1} / {slides.length}
          </div>
        </div>
      </div>

      {/* Admin controls */}
      {loggedIn && (
        <div className="admin-bar">
          <input
            type="text"
            placeholder="Nhập URL ảnh mới..."
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addSlide()}
          />
          <input
            type="text"
            placeholder="Tiêu đề (tùy chọn)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addSlide()}
          />
          <button onClick={addSlide}>Thêm ảnh</button>
        </div>
      )}
    </div>
  );
}
