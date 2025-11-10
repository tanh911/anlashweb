// controllers/authController.js
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
// @desc Register admin
// @route POST /api/auth/register
export const registerAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ success: false, error: "Thiếu username hoặc password" });

    const existing = await Admin.findOne({ username });
    if (existing)
      return res
        .status(400)
        .json({ success: false, error: "Username đã tồn tại" });

    const admin = await Admin.create({ username, password });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: { id: admin._id, username: admin.username },
    });
  } catch (err) {
    next(err);
  }
};

// controllers/authController.js

// @desc Login admin - SỬA THÀNH JWT
export const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ success: false, error: "Thiếu username hoặc password" });

    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.matchPassword(password)))
      return res
        .status(401)
        .json({ success: false, error: "Sai username hoặc password" });

    // TẠO JWT TOKEN thay vì session
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
      },
      token: token, // GỬI TOKEN VỀ FRONTEND
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get admin profile - SỬA THEO JWT
export const getAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.adminId; // ← TỪ JWT MIDDLEWARE (protect)
    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Logout admin - ĐƠN GIẢN VỚI JWT
export const logoutAdmin = (req, res) => {
  res.json({ success: true, message: "Đã đăng xuất" });
};

export const authPhone = (req, res) => {
  const { phone, name, email, datetime } = req.body;
  // Kiểm tra phone đã verified từ frontend chưa
  // Lưu booking vào DB
  res.json({ ok: true, message: "Booking created" });
};
