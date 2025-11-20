import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { app } from "./config";

const db = getFirestore(app);

// =========================
// SLIDER
// =========================

const SLIDER_REF = doc(db, "settings", "slider");

// Lắng nghe realtime
export function listenToSliderImages(callback) {
  return onSnapshot(SLIDER_REF, (snap) => {
    if (!snap.exists()) {
      // Tự tạo document nếu chưa có
      setDoc(SLIDER_REF, { images: [] });
      callback([]);
      return;
    }
    const data = snap.data();
    callback(data.images || []);
  });
}

// Lưu slider images
// firestore.js - Kiểm tra hàm này
export const saveSliderImages = async (images) => {
  try {
    console.log("💾 Đang lưu slider images:", images);

    // Đảm bảo images là array
    if (!Array.isArray(images)) {
      console.error("❌ Images không phải array:", images);
      return;
    }

    console.log(`📊 Số lượng ảnh sẽ lưu: ${images.length}`);

    const docRef = doc(db, "settings", "slider");
    await setDoc(docRef, {
      images: images,
      updatedAt: new Date(),
    });

    console.log("✅ Lưu slider images thành công");
  } catch (error) {
    console.error("❌ Lỗi khi lưu slider images:", error);
    throw error;
  }
};

// =========================
// ADS
// =========================

const ADS_REF = doc(db, "settings", "ads");

export const saveAds = async (ads) => {
  await setDoc(ADS_REF, { images: ads });
};

export const listenToAds = (callback) => {
  return onSnapshot(ADS_REF, (snap) => {
    if (!snap.exists()) {
      setDoc(ADS_REF, { images: [] });
      callback([]);
      return;
    }
    callback(snap.data().images || []);
  });
};
