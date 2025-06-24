const express = require("express");
const cors = require("cors");
require("dotenv").config();

// MongoDB connection
const { connectDB } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "MongoDB backend is running",
  });
});

// Test MongoDB endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const User = require("./models/User");
    const count = await User.countDocuments();
    res.json({
      message: "MongoDB connection successful!",
      userCount: count,
    });
  } catch (error) {
    res.status(500).json({
      error: "MongoDB connection failed",
      details: error.message,
    });
  }
});

// Import and use auth routes only
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 MongoDB backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔬 Test DB: http://localhost:${PORT}/api/test-db`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 MongoDB Connected Successfully`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.log("💡 Make sure to set MONGODB_PASSWORD in .env file");
    process.exit(1);
  }
};

startServer();

module.exports = app;
