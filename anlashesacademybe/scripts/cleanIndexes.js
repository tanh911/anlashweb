// scripts/cleanIndexes.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function cleanAllIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Xử lý Config collection
    console.log("\n🧹 Cleaning Config collection indexes...");
    try {
      const configIndexes = await db.collection("configs").indexes();
      console.log(
        "Current Config indexes:",
        configIndexes.map((idx) => idx.name)
      );

      // Xóa tất cả indexes trừ _id
      for (const index of configIndexes) {
        if (index.name !== "_id_") {
          console.log(`Dropping index: ${index.name}`);
          await db.collection("configs").dropIndex(index.name);
        }
      }
    } catch (err) {
      console.log("Config collection error:", err.message);
    }

    // Xử lý AdminSchedule collection
    console.log("\n🧹 Cleaning AdminSchedule collection indexes...");
    try {
      const scheduleIndexes = await db.collection("adminschedules").indexes();
      console.log(
        "Current AdminSchedule indexes:",
        scheduleIndexes.map((idx) => idx.name)
      );

      for (const index of scheduleIndexes) {
        if (index.name !== "_id_") {
          console.log(`Dropping index: ${index.name}`);
          await db.collection("adminschedules").dropIndex(index.name);
        }
      }
    } catch (err) {
      console.log("AdminSchedule collection error:", err.message);
    }

    console.log("\n✅ All duplicate indexes cleaned!");
    console.log("\n⚠️  Now restart your server to recreate indexes properly.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanAllIndexes();
