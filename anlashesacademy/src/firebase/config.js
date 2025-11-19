// src/firebase/config.js
import { initializeApp } from "firebase/app";
//import { getStorage, connectStorageEmulator } from "firebase/storage";
//import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCNw813rVFbhq3QOTUGLn2WDguk38TujUk",
  authDomain: "myfirstproject-bc7c4.firebaseapp.com",
  projectId: "myfirstproject-bc7c4",
  storageBucket: "myfirstproject-bc7c4.firebasestorage.app",
  messagingSenderId: "859310752603",
  appId: "1:859310752603:web:c9113dc6a4c1efa528907e",
  measurementId: "G-EPG92C0ED1",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
//   connectStorageEmulator(storage, "localhost", 9199);
//   connectFirestoreEmulator(db, "localhost", 8080);
// }

export { app, storage, db };
