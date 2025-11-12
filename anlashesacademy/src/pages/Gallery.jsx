import React, { useState } from "react";
import "./Gallery.css";

const images = [
  "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg",
  "https://images.pexels.com/photos/34950/pexels-photo.jpg",
  "https://images.pexels.com/photos/158607/cairn-fog-mystical-background-158607.jpeg",
  "https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg",
  "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg",
  "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg",
  "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg",
  "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg",
  "https://images.pexels.com/photos/34950/pexels-photo.jpg",
  "https://images.pexels.com/photos/158607/cairn-fog-mystical-background-158607.jpeg",
  "https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg",
  "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg",
  "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg",
  "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg",
  "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg",
  "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg",
  "https://images.pexels.com/photos/34950/pexels-photo.jpg",
  "https://images.pexels.com/photos/158607/cairn-fog-mystical-background-158607.jpeg",
  "https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg",
  "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg",
];

const Gallery = () => {
  const [modalImage, setModalImage] = useState(null);

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
    <div>
      <div className="row">
        {cols.map((col, colIndex) => (
          <div
            key={colIndex}
            className="column"
            style={{ flex: `${100 / 2}%` }}
          >
            {col.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Image ${idx}`}
                onClick={() => setModalImage(img)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Modal */}
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
