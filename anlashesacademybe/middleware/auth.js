import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
export const protect = (req, res, next) => {
  try {
    // 1️⃣ Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, error: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );

    req.adminId = decoded.id; // attach to request object
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.header("Authorization");

    // Debug: Log token để kiểm tra
    console.log("🔐 Auth Header:", authHeader);
    console.log("📝 Request Headers:", req.headers);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Không có token xác thực",
      });
    }

    // Kiểm tra format "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ Token không có 'Bearer' prefix");
      return res.status(401).json({
        success: false,
        error: "Token không đúng định dạng. Cần có 'Bearer ' prefix",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Debug: Kiểm tra token
    console.log("🔍 Token length:", token.length);
    console.log("🔍 Token preview:", token.substring(0, 20) + "...");

    if (
      !token ||
      token === "Bearer" ||
      token === "null" ||
      token === "undefined"
    ) {
      return res.status(401).json({
        success: false,
        error: "Token không hợp lệ",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Người dùng không tồn tại",
      });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("❌ JWT Error:", error.name, error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: `Token không hợp lệ: ${error.message}`,
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token đã hết hạn",
      });
    }

    res.status(401).json({
      success: false,
      error: "Xác thực thất bại",
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: "Không có quyền truy cập. Yêu cầu quyền admin",
    });
  }
};
