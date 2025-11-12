// src/firebase/storage.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadImage(file, path = "uploads") {
  if (!file) throw new Error("Không có file để upload");

  const imageRef = ref(storage, `${path}/${file.name}`);
  await uploadBytes(imageRef, file);
  const url = await getDownloadURL(imageRef);
  return url;
}
