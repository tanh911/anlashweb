import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { app } from "./config";

const db = getFirestore(app);

const SLIDER_DOC = "settings/slider";

export function listenToSliderImages(callback) {
  const docRef = doc(db, SLIDER_DOC);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data().images || []);
    } else {
      callback([]);
    }
  });
}

export async function saveSliderImages(images) {
  const docRef = doc(db, SLIDER_DOC);
  await setDoc(docRef, { images });
}

// Lưu ads vào Firestore
export const saveAds = async (ads) => {
  try {
    await setDoc(doc(db, "settings", "ads"), { images: ads });
    console.log("Ads saved successfully");
  } catch (error) {
    console.error("Error saving ads:", error);
    throw error;
  }
};

// Lắng nghe thay đổi ads
export const listenToAds = (callback) => {
  const unsubscribe = onSnapshot(doc(db, "settings", "ads"), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback(data.images || []);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};
