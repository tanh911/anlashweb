// components/DebugSlider.jsx
import React, { useState, useEffect } from "react";
import {
  getListenerStatus,
  forceCleanupAllListeners,
  getSliderImages,
} from "../firebase/firestore";

export const DebugSlider = () => {
  const [status, setStatus] = useState({});
  const [currentImages, setCurrentImages] = useState([]);

  useEffect(() => {
    // Update status mỗi 2 giây
    const interval = setInterval(() => {
      setStatus(getListenerStatus());
    }, 2000);

    // Lấy images hiện tại
    const loadImages = async () => {
      const images = await getSliderImages();
      setCurrentImages(images);
    };

    loadImages();

    return () => clearInterval(interval);
  }, []);

  const handleCleanup = () => {
    forceCleanupAllListeners();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
        fontFamily: "monospace",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0", color: "#4CAF50" }}>
        🔧 Slider Debug
      </h4>

      <div style={{ marginBottom: "8px" }}>
        <strong>Listener Status:</strong>
        <div
          style={{ display: "flex", alignItems: "center", marginTop: "4px" }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: status.hasGlobalListener ? "#4CAF50" : "#f44336",
              marginRight: "6px",
            }}
          ></div>
          <span>
            Global Listener: {status.hasGlobalListener ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
        <div>Callbacks: {status.callbackCount || 0}</div>
        <div>Processing: {status.isProcessing ? "YES" : "NO"}</div>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <strong>Current Images:</strong>
        <div>{currentImages.length} images</div>
        {currentImages.length > 0 && (
          <div
            style={{
              maxHeight: "100px",
              overflowY: "auto",
              marginTop: "4px",
              fontSize: "10px",
            }}
          >
            {currentImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {idx + 1}. {img.substring(0, 50)}...
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleCleanup}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          fontSize: "11px",
          background: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        🧹 Force Cleanup & Reload
      </button>

      <div
        style={{
          marginTop: "10px",
          fontSize: "10px",
          color: "#aaa",
          borderTop: "1px solid #444",
          paddingTop: "8px",
        }}
      >
        Last Hash: {status.lastDataHash || "none"}
      </div>
    </div>
  );
};
