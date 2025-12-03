<<<<<<< HEAD
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
=======
// firestore/firestore.js
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./config";

// ========== SLIDER IMAGES ==========
export const saveSliderImages = async (images) => {
  try {
    console.log("💾 Đang lưu slider images...", images);

    const sliderRef = doc(db, "websiteContent", "slider");

    await setDoc(
      sliderRef,
      {
        images: images,
        updatedAt: new Date(),
        count: images.length,
      },
      { merge: true }
    );

    console.log("✅ Đã lưu slider images thành công!");
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi lưu slider images:", error);
    throw new Error("Không thể lưu slider images");
  }
};

export const getSliderImages = async () => {
  try {
    console.log("📥 Đang lấy slider images...");

    const sliderRef = doc(db, "websiteContent", "slider");
    const docSnap = await getDoc(sliderRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("✅ Đã lấy slider images:", data.images);
      return data.images || [];
    } else {
      console.log("📝 Chưa có slider images, trả về mảng rỗng");
      return [];
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy slider images:", error);
    throw new Error("Không thể lấy slider images");
  }
};

/**
 * Lắng nghe thay đổi real-time của slider images
 * @param {function} callback - Hàm callback sẽ được gọi khi có thay đổi
 * @returns {function} Hàm unsubscribe để dừng lắng nghe
 * @example
 * // Sử dụng trong component React
 * useEffect(() => {
 *   const unsubscribe = listenToSliderImages((images) => {
 *     setSliderImages(images);
 *   });
 *
 *   return () => unsubscribe();
 * }, []);
 */
export const listenToSliderImages = (callback) => {
  try {
    console.log("👂 Đang thiết lập listener cho slider images...");

    // Tham chiếu đến document slider
    const sliderRef = doc(db, "websiteContent", "slider");

    // Thiết lập listener real-time
    const unsubscribe = onSnapshot(
      sliderRef,
      (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log("📡 Nhận slider images mới:", data.images);

            // Đảm bảo luôn trả về mảng
            const images = Array.isArray(data.images) ? data.images : [];

            // Gọi callback với dữ liệu mới
            if (typeof callback === "function") {
              callback(images);
            }
          } else {
            console.log("📝 Document slider chưa tồn tại, trả về mảng rỗng");

            // Gọi callback với mảng rỗng
            if (typeof callback === "function") {
              callback([]);
            }
          }
        } catch (error) {
          console.error("❌ Lỗi xử lý snapshot:", error);

          // Gọi callback với mảng rỗng nếu có lỗi
          if (typeof callback === "function") {
            callback([]);
          }
        }
      },
      (error) => {
        console.error("❌ Lỗi khi lắng nghe slider images:", error);

        // Gọi callback với mảng rỗng nếu có lỗi kết nối
        if (typeof callback === "function") {
          callback([]);
        }
      }
    );

    console.log("✅ Đã thiết lập listener thành công");
    return unsubscribe; // Trả về hàm để unsubscribe khi cần
  } catch (error) {
    console.error("❌ Lỗi khi thiết lập listener:", error);

    // Ném lỗi để component có thể xử lý
    throw new Error("Không thể thiết lập real-time listener cho slider images");
  }
};

// ========== IMAGE LIST ==========
export const saveImageList = async (images) => {
  try {
    console.log("💾 Đang lưu danh sách ảnh...", images);

    const imageListRef = doc(db, "websiteContent", "imageList");

    await setDoc(
      imageListRef,
      {
        images: images,
        updatedAt: new Date(),
        count: images.length,
      },
      { merge: true }
    );

    console.log("✅ Đã lưu danh sách ảnh thành công!");
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi lưu danh sách ảnh:", error);
    throw new Error("Không thể lưu danh sách ảnh");
  }
};

export const getImageList = async () => {
  try {
    console.log("📥 Đang lấy danh sách ảnh...");

    const imageListRef = doc(db, "websiteContent", "imageList");
    const docSnap = await getDoc(imageListRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("✅ Đã lấy danh sách ảnh:", data.images);
      return data.images || [];
    } else {
      console.log("📝 Chưa có danh sách ảnh, trả về mảng rỗng");
      return [];
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách ảnh:", error);
    throw new Error("Không thể lấy danh sách ảnh");
  }
};

// Thêm các hàm quản lý folder và ảnh theo folder

// Firestore structure:
// - collection: 'gallery_folders' (chứa thông tin folders)
// - collection: 'gallery_images' (chứa ảnh theo folderId)

export const getFolders = async () => {
  try {
    const docRef = doc(db, "gallery", "folders");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().folders || [];
    } else {
      // Tạo document mới nếu chưa có
      await setDoc(docRef, { folders: [] });
      return [];
    }
  } catch (error) {
    console.error("Error getting folders:", error);
    return [];
  }
};

export const saveFolders = async (folders) => {
  try {
    const docRef = doc(db, "gallery", "folders");
    await setDoc(docRef, {
      folders,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving folders:", error);
>>>>>>> feature1
    throw error;
  }
};

<<<<<<< HEAD
// =========================
// ADS
// =========================

const ADS_REF = doc(db, "settings", "ads");

export const saveAds = async (ads) => {
  await setDoc(ADS_REF, { images: ads });
};

export const listenToAds = (callback) => {
  return onSnapshot(ADS_REF, (snap) => {
    console.log("🔥 Snapshot fired:", snap.exists());
    if (!snap.exists()) {
      console.log("⚪ Document does not exist");
      callback([]);
      return;
    }

    console.log("📌 ADS data:", snap.data());
    callback(snap.data().images || []);
  }, (err) => {
    console.error("❌ Firestore listen ERROR:", err);
  });
};

=======
export const getImagesByFolder = async (folderId) => {
  try {
    const docRef = doc(db, "gallery_images", folderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().images || [];
    } else {
      // Tạo document mới cho folder
      await setDoc(docRef, {
        images: [],
        folderId,
        createdAt: new Date().toISOString(),
      });
      return [];
    }
  } catch (error) {
    console.error("Error getting folder images:", error);
    return [];
  }
};

export const saveImageToFolder = async (folderId, imageUrl) => {
  try {
    const docRef = doc(db, "gallery_images", folderId);
    const docSnap = await getDoc(docRef);

    let currentImages = [];
    if (docSnap.exists()) {
      currentImages = docSnap.data().images || [];
    }

    const updatedImages = [...currentImages, imageUrl];

    await setDoc(docRef, {
      images: updatedImages,
      folderId,
      updatedAt: new Date().toISOString(),
      ...(docSnap.exists() ? {} : { createdAt: new Date().toISOString() }),
    });
  } catch (error) {
    console.error("Error saving image to folder:", error);
    throw error;
  }
};

export const deleteImageFromFolder = async (folderId, imageIndex) => {
  try {
    const docRef = doc(db, "gallery_images", folderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentImages = docSnap.data().images || [];
      const updatedImages = currentImages.filter(
        (_, index) => index !== imageIndex
      );

      await setDoc(docRef, {
        images: updatedImages,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error deleting image from folder:", error);
    throw error;
  }
};
>>>>>>> feature1
