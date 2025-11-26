import React, { useState } from "react";
import ImageUploader from "../component/ImageUploader";
import "./Gallery.css";

const Gallery = ({ loggedIn }) => {
  const [images, setImages] = useState([]);
  const [modalImage, setModalImage] = useState(null);

  // Callback khi upload thành công
  const handleUploadSuccess = (url) => {
    setImages((prev) => [...prev, url]);
  };

  // Chia ảnh thành 2 cột
  const chunkImages = (imgs, numCols) => {
    const cols = Array.from({ length: numCols }, () => []);
    imgs.forEach((img, index) => {
      cols[index % numCols].push(img);
    });
    return cols;
  };

  const cols = chunkImages(images, 2);

  return (
    <div className="gallery-container">
      {loggedIn && (
        <ImageUploader
          loggedIn={loggedIn}
          onUploadSuccess={handleUploadSuccess}
          buttonText="Thêm ảnh vào Gallery"
          uploadType="slider" // có thể tùy chỉnh
        />
      )}

      <div className="row">
        {cols.map((col, colIndex) => (
          <div key={colIndex} className="column" style={{ flex: "50%" }}>
            {col.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Image ${idx}`}
                onClick={() => setModalImage(img)}
                style={{ cursor: "pointer", marginBottom: "10px" }}
              />
            ))}
          </div>
        ))}
      </div>

      {modalImage && (
        <div className="modal" onClick={() => setModalImage(null)}>
          <span className="close" onClick={() => setModalImage(null)}>
            &times;
          </span>
          <img className="modal-content" src={modalImage} alt="Zoomed" />
        </div>
      )}
    </div>
  );
};

export default Gallery;
