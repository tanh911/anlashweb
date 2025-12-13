// scripts/resetIndexesCompletely.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function resetIndexesCompletely() {
  try {
    console.log("🚨 COMPLETE INDEX RESET 🚨");
    console.log("=".repeat(60));

    // Kết nối với autoIndex: false
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
    });

    const db = mongoose.connection.db;

    // 1. Xóa tất cả indexes (trừ _id)
    console.log("\n🗑️  STEP 1: Removing ALL indexes...");

    const collections = await db.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();

        console.log(`\n📁 ${collectionName}:`);

        for (const index of indexes) {
          if (index.name !== "_id_") {
            console.log(`   Dropping: ${index.name}`);
            try {
              await collection.dropIndex(index.name);
              console.log(`   ✅ Dropped`);
            } catch (err) {
              console.log(`   ⚠️  Could not drop: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    // 2. Disconnect
    await mongoose.disconnect();

    console.log("\n" + "=".repeat(60));
    console.log("✅ All indexes removed completely!");
    console.log("\n📢 NEXT STEPS:");
    console.log("1. Start your server with autoIndex: false");
    console.log("2. Indexes will be created from schema definitions");
    console.log("3. No more duplicate warnings!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Chạy với confirmation
console.log(
  "\n⚠️  WARNING: This will remove ALL indexes from ALL collections!"
);
console.log("   Only _id indexes will remain.");
console.log("\nContinue? (yes/no): ");

process.stdin.once("data", (data) => {
  const input = data.toString().trim().toLowerCase();
  if (input === "yes" || input === "y") {
    resetIndexesCompletely();
  } else {
    console.log("Operation cancelled.");
    process.exit(0);
  }
});
