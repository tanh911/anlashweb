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
