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
  const timeoutRef = useRef(null);

  // Lấy dữ liệu realtime
  useEffect(() => {
    const unsubscribe = listenToSliderImages((images) => {
      const mapped = images.map((url, idx) => ({ id: idx + 1, image: url }));
      setSlides(mapped);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timeoutRef.current = setTimeout(() => nextSlide(), 3000);
    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, isPaused, slides.length]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const deleteSlide = async (id) => {
    if (!loggedIn) return;
    const newSlides = slides.filter((s) => s.id !== id);
    await saveSliderImages(newSlides.map((s) => s.image));
  };

  // Placeholder khi chưa có ảnh
  //const hasSlides = slides.length > 0;

  return (
    <div
      className="slider-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slider-container">
        {slides.length > 1 && (
          <>
            <button className="nav-btn prev-btn" onClick={prevSlide}>
              ‹
            </button>
          </>
        )}
        <div className="slider-viewport">
          <div
            className="slides-container"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
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
                      onClick={() => deleteSlide(slide.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button className="nav-btn next-btn" onClick={nextSlide}>
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
