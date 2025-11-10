import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:");
    console.error("Error:", error.message);

    // Hiển thị connection string (ẩn password)
    const connStr = process.env.MONGODB_URI;
    const safeConnStr = connStr.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
    console.error("Connection string:", safeConnStr);

    process.exit(1);
  }
};

// ❌ SAI - Đang dùng CommonJS export
// module.exports = connectDB;

// ✅ ĐÚNG - Dùng ES Modules export
export default connectDB;
