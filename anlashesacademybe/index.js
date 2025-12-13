// index.js (hoặc server.js)
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/connectDB.js";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import session from "express-session";
import mongoose from "mongoose";

const app = express();

// Middleware logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://anlashweb.vercel.app",
    ],
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Mount routes
app.use("/api", routes);

// Error handler middleware
app.use(errorHandler);

// Hàm khởi tạo schedules
// index.js - Sửa lại hàm initializeSchedules
const initializeSchedules = async () => {
  try {
    console.log("🔄 Đang khởi tạo lịch làm việc 60 ngày...");

    // Dynamic import models SAU KHI đã connect
    const AdminSchedule = (await import("./models/AdminSchedule.js")).default;
    const { createDefaultSchedule } = await import("./utils/scheduleUtils.js");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 60);

    const startDate = today.toISOString().split("T")[0];
    const endDate = targetDate.toISOString().split("T")[0];

    // Kiểm tra xem đã có schedules trong khoảng này chưa
    const existingCount = await AdminSchedule.countDocuments({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (existingCount >= 60) {
      console.log(`✅ Đã có ${existingCount} schedules mặc định (đủ 60 ngày)`);
      return;
    }

    console.log(`📅 Tạo lịch từ ${startDate} đến ${endDate}`);

    const schedulesToCreate = [];

    // Tạo schedules cho 60 ngày
    for (let i = 0; i <= 60; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateString = currentDate.toISOString().split("T")[0];

      // DÙNG AWAIT để chờ schedule được tạo
      const schedule = await createDefaultSchedule(dateString);

      console.log(`📝 Created schedule for ${dateString}:`, {
        date: schedule.date,
        slots: schedule.available_slots?.length || 0,
      });

      schedulesToCreate.push(schedule);

      // Insert theo batch để tránh memory issue
      if (schedulesToCreate.length >= 50) {
        console.log(`📤 Inserting ${schedulesToCreate.length} schedules...`);
        await AdminSchedule.insertMany(schedulesToCreate);
        console.log(`✅ Đã tạo ${schedulesToCreate.length} schedules`);
        schedulesToCreate.length = 0;
      }
    }

    // Insert phần còn lại
    if (schedulesToCreate.length > 0) {
      console.log(
        `📤 Inserting remaining ${schedulesToCreate.length} schedules...`
      );
      await AdminSchedule.insertMany(schedulesToCreate);
      console.log(`✅ Đã tạo ${schedulesToCreate.length} schedules cuối`);
    }

    const total = await AdminSchedule.countDocuments({
      date: { $gte: startDate, $lte: endDate },
    });

    console.log(`🎉 Hoàn tất! Tổng số schedules: ${total}`);
  } catch (error) {
    console.error("❌ Lỗi khởi tạo schedules:", error);
    // Log chi tiết hơn
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
  }
};

// Route kiểm tra health
app.get("/api/health", async (req, res) => {
  try {
    // Dynamic import
    const AdminSchedule = (await import("./models/AdminSchedule.js")).default;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 60);

    const scheduleCount = await AdminSchedule.countDocuments({
      date: {
        $gte: today.toISOString().split("T")[0],
        $lte: futureDate.toISOString().split("T")[0],
      },
    });

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      schedules: {
        total: await AdminSchedule.countDocuments(),
        next_60_days: scheduleCount,
        should_have: 61,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Route manual init schedules
app.post("/api/admin/init-schedules", async (req, res) => {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await initializeSchedules();

    res.json({
      success: true,
      message: "Đã khởi tạo schedules thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Connect to database
const startServer = async () => {
  try {
    // Connect database
    await connectDB();
    console.log("✅ Database connected");

    // Khởi tạo schedules
    await initializeSchedules();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📅 Schedules: Auto-initialized for 60 days`);
      console.log(`🔧 autoIndex: ${mongoose.get("autoIndex")}`);
    });

    // Handle graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Process terminated");
      });
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

// Start server
startServer();

process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", err);
  process.exit(1);
});
