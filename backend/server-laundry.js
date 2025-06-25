const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables in order of preference
dotenv.config({ path: ".env.development" }); // Development credentials
dotenv.config({ path: ".env.local" }); // User-specific overrides
dotenv.config(); // Default .env file

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "https://cleancare-pro.onrender.com",
  "https://cleancare-pro-frontend.onrender.com",
];

// Add environment-specific origins
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const connectDB = async () => {
  try {
    // Check if real credentials are provided (not placeholders)
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const cluster = process.env.MONGODB_CLUSTER;

    if (
      !username ||
      !password ||
      !cluster ||
      username === "your_mongodb_username" ||
      password === "your_mongodb_password" ||
      cluster === "your_cluster.mongodb.net"
    ) {
      console.log(
        "⚠️ MongoDB credentials not configured - running in mock mode",
      );
      return;
    }

    const mongoURI =
      process.env.MONGODB_URI ||
      `mongodb+srv://${username}:${password}@${cluster}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("⚠️ Running in mock mode without database");
  }
};

// Connect to database
connectDB();

// Import routes with error handling
let otpAuthRoutes, bookingRoutes, locationRoutes;

try {
  otpAuthRoutes = require("./routes/otp-auth");
  console.log("✅ OTP Auth routes loaded");
} catch (error) {
  console.error("❌ Failed to load OTP Auth routes:", error.message);
}

try {
  bookingRoutes = require("./routes/bookings");
  console.log("✅ Booking routes loaded");
} catch (error) {
  console.error("❌ Failed to load Booking routes:", error.message);
}

try {
  locationRoutes = require("./routes/location");
  console.log("✅ Location routes loaded");
} catch (error) {
  console.error("❌ Failed to load Location routes:", error.message);
}

// API Routes with error handling
if (otpAuthRoutes) {
  app.use("/api/auth", otpAuthRoutes);
  console.log("🔗 Auth routes registered at /api/auth");
}

if (bookingRoutes) {
  app.use("/api/bookings", bookingRoutes);
  console.log("🔗 Booking routes registered at /api/bookings");
}

if (locationRoutes) {
  app.use("/api/location", locationRoutes);
  console.log("🔗 Location routes registered at /api/location");
}

// WhatsApp Auth routes
try {
  const whatsappAuthRoutes = require("./routes/whatsapp-auth");
  app.use("/api/whatsapp", whatsappAuthRoutes);
  console.log("🔗 WhatsApp Auth routes registered at /api/whatsapp");
} catch (error) {
  console.error("❌ Failed to load WhatsApp Auth routes:", error.message);
}

// Push notification endpoints
app.post("/api/push/subscribe", (req, res) => {
  // Store push subscription in database
  // In production, save this to your user's profile
  console.log("Push subscription received:", req.body);
  res.json({ success: true });
});

app.post("/api/push/unsubscribe", (req, res) => {
  // Remove push subscription from database
  console.log("Push unsubscribe request");
  res.json({ success: true });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "CleanCare Pro API",
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "CleanCare Pro API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CleanCare Pro server running on port ${PORT}`);
  console.log(`📱 API available at: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
