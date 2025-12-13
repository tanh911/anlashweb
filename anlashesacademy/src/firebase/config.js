// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
const auth = getAuth(app);

export { app, storage, db, auth };
