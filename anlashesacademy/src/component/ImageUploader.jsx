import { useState, useRef } from "react";
import { uploadToCloudinary } from "../utils/cloudinaryUpload"; // ⬅️ dùng Cloudinary
import { saveSliderImages } from "../firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "./ImageUploader.css";

export default function ImageUploader({ loggedIn }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  if (!loggedIn) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      const urls = [];

      for (const file of files) {
        const url = await uploadToCloudinary(file);
        urls.push(url);
      }

      const snap = await getDoc(doc(db, "settings/slider"));
      const old = snap.exists() ? snap.data().images || [] : [];
      await saveSliderImages([...old, ...urls]);

      setFiles([]);
      alert("✅ Ảnh đã được upload lên Cloudinary và lưu vào Firestore!");
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
      alert("Lỗi khi upload ảnh!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="image-uploader">
      <div
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current.click()}
      >
        <p>Kéo thả ảnh vào đây hoặc nhấn để chọn nhiều ảnh</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) =>
            setFiles((prev) => [...prev, ...Array.from(e.target.files)])
          }
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={isUploading || files.length === 0}
      >
        {isUploading ? "Đang upload..." : "Upload ảnh Slider"}
      </button>

      <div className="preview">
        {files.map((f, i) => (
          <div key={i} className="preview-wrapper">
            <img src={URL.createObjectURL(f)} alt="preview" />
            <button className="btn-remove" onClick={() => handleRemoveFile(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
