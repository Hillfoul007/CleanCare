const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import database connection
const { connectDB } = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const riderRoutes = require("./routes/riders");
const locationRoutes = require("./routes/location");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "Home Services Backend API",
    version: "1.0.0",
    database: "MongoDB",
  });
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Home Services API is working!",
    version: "1.0.0",
    endpoints: [
      "GET /health - Health check",
      "GET /api/test - API test",
      "POST /api/auth/register - User registration",
      "POST /api/auth/login - User login",
      "POST /api/auth/verify-token - Token verification",
      "GET /api/auth/profile - User profile",
      "POST /api/bookings - Create booking",
      "GET /api/bookings/customer/:id - Get customer bookings",
      "GET /api/bookings/rider/:id - Get rider bookings",
      "GET /api/riders/profile/:userId - Get rider profile",
      "POST /api/riders/profile - Create rider profile",
    ],
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/location", locationRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Home Services Backend API",
    version: "1.0.0",
    documentation: "/api/test",
    health: "/health",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 CORS enabled for frontend connections`);
      console.log(`📋 API endpoints available at /api/*`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("\n🔄 Graceful shutdown initiated...");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start the server
startServer();

module.exports = app;
