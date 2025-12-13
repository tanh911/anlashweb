// scripts/debugIndexes.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function debugIndexes() {
  try {
    // Connect với logging
    mongoose.set("debug", true);

    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
    });

    console.log("🔍 DEBUGGING INDEXES");
    console.log("=".repeat(60));

    const db = mongoose.connection.db;

    // 1. Kiểm tra indexes hiện tại trong database
    console.log("\n1. CURRENT INDEXES IN DATABASE:");

    const configIndexes = await db.collection("configs").indexes();
    console.log("\n📁 configs collection:");
    configIndexes.forEach((idx, i) => {
      console.log(`   ${i + 1}. Name: "${idx.name}"`);
      console.log(`      Key: ${JSON.stringify(idx.key)}`);
      console.log(`      Unique: ${idx.unique ? "Yes" : "No"}`);
      console.log(`      Background: ${idx.background ? "Yes" : "No"}`);
      console.log();
    });

    const scheduleIndexes = await db.collection("adminschedules").indexes();
    console.log("\n📁 adminschedules collection:");
    scheduleIndexes.forEach((idx, i) => {
      console.log(`   ${i + 1}. Name: "${idx.name}"`);
      console.log(`      Key: ${JSON.stringify(idx.key)}`);
      console.log(`      Unique: ${idx.unique ? "Yes" : "No"}`);
      console.log(`      Background: ${idx.background ? "Yes" : "No"}`);
      console.log();
    });

    // 2. Kiểm tra schema definitions
    console.log("\n2. SCHEMA DEFINITIONS:");

    // Lấy AdminSchedule model
    const AdminSchedule =
      mongoose.models.AdminSchedule || mongoose.model("AdminSchedule");

    console.log("\nAdminSchedule schema indexes from mongoose:");
    if (AdminSchedule.schema.indexes) {
      const schemaIndexes = AdminSchedule.schema.indexes();
      console.log("Schema indexes():", schemaIndexes);
    }

    // 3. Check for duplicate index creation
    console.log("\n3. CHECKING FOR DUPLICATE CREATION:");

    // Listen for index events
    mongoose.connection.on("index", function (err, message) {
      console.log("📢 INDEX EVENT:", message || "No message");
      if (err) console.log("   Error:", err.message);
    });

    // Tạo indexes thủ công để xem có bị duplicate không
    console.log("\n4. MANUALLY CREATING INDEXES:");

    try {
      // Tạo index cho date
      console.log("Creating date index...");
      await db
        .collection("adminschedules")
        .createIndex({ date: 1 }, { unique: true, name: "debug_date_unique" });
      console.log("✅ Created date index");
    } catch (err) {
      console.log("❌ Error creating date index:", err.message);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Debug error:", error);
  }
}

debugIndexes();
