import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/connectDB.js";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import session from "express-session";
const app = express();
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173","https://anlashweb.onrender.com"],
    credentials: true,
  })
);
// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax", // hoặc "none" nếu deploy HTTPS
      secure: false, // true nếu HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Mount routes
app.use("/api", routes);

// Error handler middleware (phải đặt cuối cùng)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", err);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});
