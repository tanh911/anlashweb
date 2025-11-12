export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); // preset unsigned bạn đã tạo

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dtodapju0/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Lỗi Cloudinary:", data);
    throw new Error("Upload thất bại!");
  }

  return data.secure_url;
}
