// firestore/firestore.js
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./config";

// ========== DEBOUNCE & LISTENER MANAGEMENT ==========
const saveOperations = new Map(); // Theo dõi các operation đang chạy
let globalSliderListener = null;
let globalSliderCallbacks = new Set();
let isProcessing = false;
let lastDataHash = null;
/**
 * Debounce save operation để tránh lưu nhiều lần
 */
const debouncedSave = async (operationId, saveFunction) => {
  // Nếu operation này đang chạy, không chạy lại
  if (saveOperations.has(operationId)) {
    console.log(`⏳ Operation ${operationId} đang chạy, bỏ qua...`);
    return;
  }

  try {
    saveOperations.set(operationId, true);
    await saveFunction();
  } finally {
    // Cleanup sau 500ms để tránh race condition
    setTimeout(() => {
      saveOperations.delete(operationId);
    }, 500);
  }
};

/**
 * Tạo unique ID cho listener
 */
const generateListenerId = (type, suffix = "") => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${
    suffix ? "_" + suffix : ""
  }`;
};

// ========== SLIDER IMAGES ==========
export const saveSliderImages = async (images) => {
  return debouncedSave("saveSliderImages", async () => {
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

      return true;
    } catch (error) {
      console.error("❌ Lỗi khi lưu slider images:", error);
      throw new Error("Không thể lưu slider images");
    }
  });
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

// firestore.js - SỬA HÀM listenToSliderImages
export const listenToSliderImages = (callback, listenerId = null) => {
  try {
    const id = listenerId || `slider_${Date.now()}`;

    // 🎯 CHỈ TẠO 1 LISTENER GLOBAL DUY NHẤT
    if (!globalSliderListener) {
      const sliderRef = doc(db, "websiteContent", "slider");

      globalSliderListener = onSnapshot(
        sliderRef,
        (docSnapshot) => {
          // 🎯 CHẶN XỬ LÝ TRÙNG
          if (isProcessing) {
            console.log("⏸️ Đang xử lý, bỏ qua snapshot");
            return;
          }

          isProcessing = true;

          try {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const images = data.images || [];
              const currentHash = JSON.stringify(images);

              console.log("🔍 Firestore snapshot data:", {
                exists: docSnapshot.exists(),
                data: data,
                imagesCount: images.length,
                currentHash: currentHash.substring(0, 50) + "...",
                lastDataHash: lastDataHash
                  ? lastDataHash.substring(0, 50) + "..."
                  : "null",
              });

              // 🎯 KIỂM TRA DỮ LIỆU CÓ THAY ĐỔI KHÔNG
              if (currentHash === lastDataHash) {
                isProcessing = false;
                return;
              }

              lastDataHash = currentHash;

              // Tạo array từ Set để tránh concurrent modification
              const callbacksArray = Array.from(globalSliderCallbacks);
              // eslint-disable-next-line no-unused-vars
              callbacksArray.forEach((cb, index) => {
                try {
                  cb(images);
                } catch (err) {
                  console.error("❌ Lỗi trong callback:", err);
                }
              });
            } else {
              console.log("📝 Document slider chưa tồn tại");
              lastDataHash = JSON.stringify([]);
              const callbacksArray = Array.from(globalSliderCallbacks);
              callbacksArray.forEach((cb, index) => {
                try {
                  cb([]);
                } catch (err) {
                  console.error("❌ Lỗi trong callback:", err, index);
                }
              });
            }
          } catch (error) {
            console.error("❌ Lỗi xử lý snapshot:", error);
          } finally {
            // 🎯 GIẢI PHÓNG SAU 50ms
            setTimeout(() => {
              isProcessing = false;
            }, 50);
          }
        },
        (error) => {
          console.error("❌ Lỗi global listener:", error);
        }
      );
    }

    // 🎯 THÊM CALLBACK VÀO SET
    globalSliderCallbacks.add(callback);

    // 🎯 QUAN TRỌNG: GỬI DỮ LIỆU HIỆN TẠI NGAY LẬP TỨC
    // Lấy data hiện tại từ Firestore và gửi ngay cho callback mới
    const sendInitialData = async () => {
      try {
        const sliderRef = doc(db, "websiteContent", "slider");
        const docSnap = await getDoc(sliderRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const images = data.images || [];
          callback(images);
        } else {
          console.log("📦 Gửi empty array cho callback mới");
          callback([]);
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy data hiện tại:", error);
        callback([]);
      }
    };

    // Gọi async nhưng không cần await
    sendInitialData();

    // 🎯 TRẢ VỀ HÀM UNSUBSCRIBE
    const unsubscribe = () => {
      console.log(`🛑 Hủy đăng ký callback: ${id}`);
      globalSliderCallbacks.delete(callback);

      // 🎯 NẾU KHÔNG CÒN CALLBACK NÀO, HỦY LISTENER
      if (globalSliderCallbacks.size === 0 && globalSliderListener) {
        console.log("🧹 Không còn callback nào, hủy global listener");
        globalSliderListener();
        globalSliderListener = null;
        lastDataHash = null;
        isProcessing = false;
      }
    };

    return unsubscribe;
  } catch (error) {
    console.error("❌ Lỗi khi thiết lập listener:", error);
    throw error;
  }
};
export const getListenerStatus = () => {
  return {
    hasGlobalListener: !!globalSliderListener,
    callbackCount: globalSliderCallbacks.size,
    isProcessing,
    lastDataHash: lastDataHash ? "hashed" : null,
  };
};

/**
 * Force cleanup tất cả listeners
 */
export const forceCleanupAllListeners = () => {
  console.log("🧹 Force cleanup all listeners");

  if (globalSliderListener) {
    globalSliderListener();
    globalSliderListener = null;
  }

  globalSliderCallbacks.clear();
  lastDataHash = null;
  isProcessing = false;
};
// ========== IMAGE LIST ==========
export const saveImageList = async (images) => {
  return debouncedSave("saveImageList", async () => {
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
  });
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

// ========== FOLDER MANAGEMENT ==========
export const getFolders = async () => {
  try {
    const docRef = doc(db, "gallery", "folders");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let folders = data.folders || [];

      // 🎯 VALIDATE và FIX data nếu cần
      if (Array.isArray(folders)) {
        folders = folders.map((folder) => {
          // Nếu folder là string, convert thành object
          if (typeof folder === "string") {
            return {
              id: folder,
              name: `Folder ${folder}`,
              createdAt: new Date().toISOString(),
              itemCount: 0,
            };
          }

          // Đảm bảo folder có đầy đủ properties
          return {
            id: folder.id || Date.now().toString(),
            name: folder.name || `Folder ${folder.id || "Unnamed"}`,
            createdAt: folder.createdAt || new Date().toISOString(),
            updatedAt: folder.updatedAt || new Date().toISOString(),
            itemCount: folder.itemCount || 0,
          };
        });
      } else {
        console.warn("⚠️ folders không phải array, reset về []");
        folders = [];
      }

      return folders;
    } else {
      // Tạo document mới nếu chưa có
      const initialData = {
        folders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, initialData);
      console.log("📁 Chưa có folder, tạo mới");
      return [];
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy folders:", error);
    return [];
  }
};

export const saveFolders = async (folders) => {
  return debouncedSave("saveFolders", async () => {
    try {
      console.log("💾 Đang lưu danh sách folder...", folders);

      const docRef = doc(db, "gallery", "folders");

      // 🎯 ĐẢM BẢO folders là array của objects
      if (!Array.isArray(folders)) {
        console.error("❌ folders không phải array:", folders);
        throw new Error("folders phải là array");
      }

      // 🎯 VALIDATE mỗi folder
      const validatedFolders = folders.map((folder) => {
        // Nếu folder là string, convert thành object
        if (typeof folder === "string") {
          console.warn(`⚠️ Folder là string, converting: ${folder}`);
          return {
            id: folder,
            name: `Folder ${folder}`,
            createdAt: new Date().toISOString(),
          };
        }

        // Nếu folder là object, đảm bảo có các trường cần thiết
        return {
          id: folder.id || Date.now().toString(),
          name: folder.name || `Folder ${folder.id || Date.now()}`,
          createdAt: folder.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          itemCount: folder.itemCount || 0,
        };
      });

      const dataToSave = {
        folders: validatedFolders,
        updatedAt: new Date().toISOString(),
        totalFolders: validatedFolders.length,
      };

      await setDoc(docRef, dataToSave);
    } catch (error) {
      console.error("Error details:", {
        foldersType: typeof folders,
        isArray: Array.isArray(folders),
        foldersValue: folders,
      });
      throw error;
    }
  });
};

export const getImagesByFolder = async (folderId) => {
  try {
    const docRef = doc(db, "gallery_images", folderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const images = docSnap.data().images || [];
      return images;
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
    console.error(`❌ Lỗi khi lấy ảnh từ folder ${folderId}:`, error);
    return [];
  }
};

export const saveImageToFolder = async (folderId, imageUrl) => {
  const operationId = `saveImageToFolder_${folderId}`;
  return debouncedSave(operationId, async () => {
    try {
      console.log(`💾 Đang lưu ảnh vào folder ${folderId}...`, imageUrl);

      const docRef = doc(db, "gallery_images", folderId);
      const docSnap = await getDoc(docRef);

      let currentImages = [];
      if (docSnap.exists()) {
        currentImages = docSnap.data().images || [];
      }

      // KIỂM TRA TRÙNG LẶP - Đây là nguyên nhân chính gây lưu 2 lần
      const isDuplicate = currentImages.some((img) => img === imageUrl);
      if (isDuplicate) {
        console.log(
          `⚠️ Ảnh đã tồn tại trong folder ${folderId}, không lưu lại`
        );
        return;
      }

      const updatedImages = [...currentImages, imageUrl];

      await setDoc(docRef, {
        images: updatedImages,
        folderId,
        updatedAt: new Date().toISOString(),
        ...(docSnap.exists() ? {} : { createdAt: new Date().toISOString() }),
      });

      console.log(`✅ Đã lưu ảnh vào folder ${folderId} thành công`);
    } catch (error) {
      console.error(`❌ Lỗi khi lưu ảnh vào folder ${folderId}:`, error);
      throw error;
    }
  });
};

export const deleteImageFromFolder = async (folderId, imageIndex) => {
  const operationId = `deleteImageFromFolder_${folderId}_${imageIndex}`;
  return debouncedSave(operationId, async () => {
    try {
      console.log(`🗑️ Đang xóa ảnh ${imageIndex} từ folder ${folderId}...`);

      const docRef = doc(db, "gallery_images", folderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentImages = docSnap.data().images || [];

        // Kiểm tra index hợp lệ
        if (imageIndex < 0 || imageIndex >= currentImages.length) {
          console.error(
            `❌ Index ${imageIndex} không hợp lệ trong folder ${folderId}`
          );
          throw new Error(`Index ${imageIndex} không hợp lệ`);
        }

        const updatedImages = currentImages.filter(
          (_, index) => index !== imageIndex
        );

        await setDoc(docRef, {
          images: updatedImages,
          updatedAt: new Date().toISOString(),
        });

        console.log(
          `✅ Đã xóa ảnh ${imageIndex} từ folder ${folderId} thành công`
        );
      } else {
        console.log(`📝 Folder ${folderId} không tồn tại`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xóa ảnh từ folder ${folderId}:`, error);
      throw error;
    }
  });
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Lắng nghe thay đổi real-time của folder images
 * @param {string} folderId - ID của folder cần lắng nghe
 * @param {function} callback - Hàm callback sẽ được gọi khi có thay đổi
 * @param {string} listenerId - ID của listener (tự động tạo nếu không cung cấp)
 * @returns {function} Hàm unsubscribe để dừng lắng nghe
 */
export const listenToFolderImages = (folderId, callback, listenerId = null) => {
  try {
    const id = listenerId || generateListenerId(`folder_${folderId}`);
    console.log(`👂 Đang thiết lập listener ${id} cho folder ${folderId}...`);

    // Thiết lập listener mới
    const docRef = doc(db, "gallery_images", folderId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const images = data.images || [];
            console.log(
              `📡 [${id}] Nhận ${images.length} ảnh mới từ folder ${folderId}`
            );

            // Gọi callback với dữ liệu mới
            if (typeof callback === "function") {
              callback(images);
            }
          } else {
            console.log(
              `📝 [${id}] Folder ${folderId} chưa tồn tại, trả về mảng rỗng`
            );
            if (typeof callback === "function") {
              callback([]);
            }
          }
        } catch (error) {
          console.error(
            `❌ [${id}] Lỗi xử lý snapshot folder ${folderId}:`,
            error
          );
          if (typeof callback === "function") {
            callback([]);
          }
        }
      },
      (error) => {
        console.error(
          `❌ [${id}] Lỗi khi lắng nghe folder ${folderId}:`,
          error
        );
        if (typeof callback === "function") {
          callback([]);
        }
      }
    );

    // Lưu lại listener để quản lý
    console.log(`✅ Đã thiết lập listener ${id} thành công`);

    // Trả về hàm unsubscribe
    const unsubscribeWrapper = () => {
      console.log(`🛑 Đang dừng listener ${id}...`);
      unsubscribe();
    };

    return unsubscribeWrapper;
  } catch (error) {
    console.error(
      `❌ Lỗi khi thiết lập listener cho folder ${folderId}:`,
      error
    );
    throw new Error(
      `Không thể thiết lập real-time listener cho folder ${folderId}`
    );
  }
};

/**
 * Hủy tất cả active listeners
 */
export const cleanupAllListeners = () => {
  console.log(`🧹 Đang dọn dẹp tất cả listeners...`);
};

/**
 * Lấy thông tin trạng thái hiện tại của firestore module
 */
export const getFirestoreStatus = () => {
  return {
    saveOperations: Array.from(saveOperations.keys()),
    totalSaveOperations: saveOperations.size,
  };
};

/**
 * Clear tất cả debounce operations
 */
export const clearAllDebounce = () => {
  const count = saveOperations.size;
  saveOperations.clear();
  console.log(`🧹 Đã clear ${count} debounce operations`);
};
