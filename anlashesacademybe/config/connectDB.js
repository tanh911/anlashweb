// config/connectDB.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");

    // 🚨 QUAN TRỌNG: Chỉ tắt autoIndex thôi
    mongoose.set("autoIndex", false);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false, // QUAN TRỌNG
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:");
    console.error("Error:", error.message);

    const connStr = process.env.MONGODB_URI;
    const safeConnStr = connStr.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
    console.error("Connection string:", safeConnStr);

    process.exit(1);
  }
};

export default connectDB;
