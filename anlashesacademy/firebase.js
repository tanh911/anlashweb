import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

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
export const auth = getAuth(app);

// 🔥 Thêm dòng này khi test số điện thoại ảo Firebase
//auth.settings.appVerificationDisabledForTesting = true;

// Hàm setup reCAPTCHA (chỉ cần 1 lần)
export const setUpRecaptcha = (containerId) => {
  return new RecaptchaVerifier(containerId, { size: "invisible" }, auth);
};
