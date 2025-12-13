// scripts/createAllIndexes.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function createAllIndexes() {
  try {
    console.log("🔧 Creating ALL indexes manually...");

    // Kết nối với autoIndex: false
    mongoose.set("autoIndex", false);

    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
    });

    const db = mongoose.connection.db;

    console.log("\n📊 Creating indexes for all collections...");

    // 1. Config collection
    console.log("\n📁 configs:");
    await db
      .collection("configs")
      .createIndex({ key: 1 }, { unique: true, name: "config_key_unique" });
    console.log("  ✅ Created: config_key_unique");

    // 2. AdminSchedule collection
    console.log("\n📁 adminschedules:");
    await db
      .collection("adminschedules")
      .createIndex({ date: 1 }, { unique: true, name: "schedule_date_unique" });
    console.log("  ✅ Created: schedule_date_unique");

    await db
      .collection("adminschedules")
      .createIndex(
        { is_available: 1, date: 1 },
        { name: "available_date_compound" }
      );
    console.log("  ✅ Created: available_date_compound");

    await db
      .collection("adminschedules")
      .createIndex(
        { custom_slots: 1, date: 1 },
        { name: "custom_date_compound" }
      );
    console.log("  ✅ Created: custom_date_compound");

    // 3. Admins collection
    console.log("\n📁 admins:");
    await db
      .collection("admins")
      .createIndex(
        { username: 1 },
        { unique: true, name: "admin_username_unique" }
      );
    console.log("  ✅ Created: admin_username_unique");

    // 4. Services collection
    console.log("\n📁 services:");
    await db
      .collection("services")
      .createIndex({ name: 1 }, { unique: true, name: "service_name_unique" });
    console.log("  ✅ Created: service_name_unique");

    // 5. Appointments collection
    console.log("\n📁 appointments:");
    await db
      .collection("appointments")
      .createIndex(
        { date: 1, time: 1 },
        { unique: true, name: "appointment_datetime_unique" }
      );
    console.log("  ✅ Created: appointment_datetime_unique");

    // Kiểm tra tất cả indexes
    console.log("\n📊 FINAL INDEXES REPORT:");
    console.log("=".repeat(50));

    const collections = [
      "configs",
      "adminschedules",
      "admins",
      "services",
      "appointments",
      "contents",
      "posts",
      "courses",
    ];

    let totalIndexes = 0;

    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`\n📦 ${collectionName}:`);
        indexes.forEach((idx, i) => {
          console.log(
            `  ${i + 1}. ${idx.name.padEnd(30)} ${JSON.stringify(
              idx.key
            ).padEnd(25)} ${idx.unique ? "UNIQUE" : ""}`
          );
        });
        totalIndexes += indexes.length;
      } catch (err) {
        console.log(`\n📦 ${collectionName}: (no collection or error)`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Total indexes: ${totalIndexes}`);
    console.log("🎉 All indexes created successfully!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAllIndexes();
