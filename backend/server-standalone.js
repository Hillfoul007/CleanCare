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

// Define MongoDB routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/location", locationRoutes);

// Health check endpoint showing MongoDB status
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "Home Services Backend API with MongoDB",
    version: "1.0.0",
    database:
      mongoose.connection.readyState === 1
        ? "MongoDB Connected"
        : "MongoDB Disconnected",
    mongodb: {
      cluster: process.env.MONGODB_CLUSTER,
      database: process.env.MONGODB_DATABASE,
      status:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      readyState: mongoose.connection.readyState,
    },
  });
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Home Services API is working! (Standalone Mode)",
    version: "1.0.0",
    mode: "standalone",
    note: "This is running without MongoDB for basic testing",
    endpoints: [
      "GET /health - Health check",
      "GET /api/test - API test",
      "POST /api/auth/register - User registration (mock)",
      "POST /api/auth/login - User login (mock)",
      "POST /api/bookings - Create booking (mock)",
      "GET /api/bookings/customer/:id - Get customer bookings (mock)",
    ],
    timestamp: new Date().toISOString(),
  });
});

/*
// MOCK ENDPOINTS - COMMENTED OUT SINCE WE'RE USING REAL MONGODB ROUTES
// Location endpoints for geocoding
app.post("/api/location/geocode", (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  // Mock geocoding response
  const mockAddress = "New York, NY, USA";

  res.json({
    address: mockAddress,
    components: [],
    geometry: { location: { lat, lng } },
  });
});

app.post("/api/location/coordinates", (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  // Mock coordinates response
  res.json({
    coordinates: { lat: 40.7128, lng: -74.006 }, // NYC coordinates
    formatted_address: address,
    components: [],
  });
});

// Debug endpoint to check request data
app.all("/api/debug/*", (req, res) => {
  res.json({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  });
});

// Mock authentication endpoints
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Mock successful registration
  const mockUser = {
    _id: `user_${Date.now()}`,
    email,
    full_name: name,
    phone: phone || "",
    user_type: "customer",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockToken = `mock_token_${Date.now()}`;

  res.status(201).json({
    message: "User registered successfully (mock)",
    user: mockUser,
    token: mockToken,
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Mock successful login - create user if doesn't exist
  const mockUser = {
    _id: `user_${Date.now()}`,
    email,
    full_name: email
      .split("@")[0]
      .replace(/[^a-zA-Z]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    phone: "+1234567890",
    user_type: "customer",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockToken = `mock_token_${Date.now()}`;

  res.json({
    message: "Login successful (mock)",
    user: mockUser,
    token: mockToken,
  });
});

// Check if phone exists
app.post("/api/auth/check-phone", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  console.log("Checking phone:", phone);

  // Mock response - in real app, this would check MongoDB
  // For demo, return existing user for some numbers
  const existingNumbers = ["+1234567890", "+9876543210", "+1111111111"];

  if (existingNumbers.includes(phone)) {
    const mockUser = {
      _id: `user_phone_${phone.replace(/\D/g, "")}`,
      phone,
      full_name: "John Doe",
      user_type: "customer",
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log("Found existing user:", mockUser);
    res.json({ exists: true, user: mockUser });
  } else {
    console.log("New user, no existing record");
    res.json({ exists: false, user: null });
  }
});

// Register with phone (after OTP verification)
app.post("/api/auth/register-phone", (req, res) => {
  const {
    phone,
    full_name,
    user_type = "customer",
    phone_verified = true,
  } = req.body;

  if (!phone || !full_name) {
    return res.status(400).json({ error: "Phone and full name are required" });
  }

  // Mock successful registration
  const mockUser = {
    _id: `user_phone_${Date.now()}`,
    phone,
    full_name,
    user_type,
    phone_verified,
    created_at: new Date(),
    updated_at: new Date(),
  };

  res.status(201).json({
    message: "User registered successfully (mock)",
    user: mockUser,
  });
});

// Mock booking endpoint for testing
app.post("/api/bookings", (req, res) => {
  const {
    customer_id,
    service,
    service_type,
    services,
    scheduled_date,
    scheduled_time,
    provider_name,
    address,
    total_price,
  } = req.body;

  // Handle missing customer_id gracefully
  const effectiveCustomerId = customer_id || `mock_customer_${Date.now()}`;

  // Basic validation
  if (
    !service ||
    !scheduled_date ||
    !scheduled_time ||
    !address ||
    !total_price
  ) {
    return res.status(400).json({
      error: "Missing required fields",
      details: "Please provide service, date, time, address, and price",
    });
  }

  // Mock successful booking creation
  const mockBooking = {
    _id: `booking_${Date.now()}`,
    customer_id: effectiveCustomerId,
    service,
    service_type: service_type || "Single Service",
    services: services || [service],
    scheduled_date,
    scheduled_time,
    provider_name: provider_name || "Home Services",
    address,
    total_price,
    final_amount: total_price,
    status: "pending",
    payment_status: "pending",
    created_at: new Date(),
    updated_at: new Date(),
  };

  res.status(201).json({
    message: "Booking created successfully (mock)",
    booking: mockBooking,
  });
});

// Update booking status (for editing/cancelling)
app.put("/api/bookings/:bookingId/status", (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  console.log(`Updating booking ${bookingId} to status: ${status}`);

  // Mock successful update
  const updatedBooking = {
    _id: bookingId,
    status: status,
    updated_at: new Date(),
  };

  res.json({
    message: "Booking status updated successfully (mock)",
    booking: updatedBooking,
  });
});

// Cancel booking
app.delete("/api/bookings/:bookingId", (req, res) => {
  const { bookingId } = req.params;
  const { user_id, user_type } = req.body;

  console.log(`Cancelling booking ${bookingId} by user ${user_id}`);

  // Mock successful cancellation
  const cancelledBooking = {
    _id: bookingId,
    status: "cancelled",
    updated_at: new Date(),
  };

  res.json({
    message: "Booking cancelled successfully (mock)",
    booking: cancelledBooking,
  });
});

// Mock get customer bookings
app.get("/api/bookings/customer/:customerId", (req, res) => {
  const { customerId } = req.params;

  console.log("Getting bookings for customer:", customerId);

  // Mock bookings data with more variety
  const mockBookings = [
    {
      _id: `booking_${Date.now()}_1`,
      customer_id: customerId,
      service: "House Cleaning",
      service_type: "Single Service",
      services: ["House Cleaning"],
      status: "completed",
      scheduled_date: "2024-01-15",
      scheduled_time: "10:00 AM",
      provider_name: "CleanPro Services",
      address: "123 Main St, New York, NY",
      total_price: 100,
      final_amount: 95,
      payment_status: "paid",
      additional_details: "Deep cleaning requested",
      created_at: new Date(Date.now() - 86400000 * 7), // 1 week ago
      updated_at: new Date(Date.now() - 86400000 * 7),
    },
    {
      _id: `booking_${Date.now()}_2`,
      customer_id: customerId,
      service: "Plumbing Repair",
      service_type: "Single Service",
      services: ["Plumbing Repair"],
      status: "confirmed",
      scheduled_date: "2024-01-25",
      scheduled_time: "2:00 PM",
      provider_name: "Quick Fix Plumbing",
      address: "456 Oak Ave, New York, NY",
      total_price: 150,
      final_amount: 140,
      payment_status: "pending",
      additional_details: "Kitchen sink leak",
      created_at: new Date(Date.now() - 86400000 * 2), // 2 days ago
      updated_at: new Date(Date.now() - 86400000 * 2),
    },
    {
      _id: `booking_${Date.now()}_3`,
      customer_id: customerId,
      service: "Car Wash",
      service_type: "Single Service",
      services: ["Car Wash & Detail"],
      status: "pending",
      scheduled_date: "2024-01-30",
      scheduled_time: "11:00 AM",
      provider_name: "Auto Shine",
      address: "789 Park St, New York, NY",
      total_price: 50,
      final_amount: 45,
      payment_status: "pending",
      additional_details: "SUV exterior and interior cleaning",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  res.json({
    bookings: mockBookings,
    message: "Mock booking history data",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Home Services Backend API (Standalone Mode)",
    version: "1.0.0",
    mode: "standalone",
    documentation: "/api/test",
    health: "/health",
    note: "Running without MongoDB for basic API testing",
  });
});

*/
// END OF MOCK ENDPOINTS - USING REAL MONGODB ROUTES INSTEAD

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

// Start server
// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connection established");

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 CORS enabled for frontend connections`);
      console.log(`✅ MongoDB database connected and ready`);
      console.log(`📋 Full API endpoints available at /api/*`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("\n🔄 Graceful shutdown initiated...");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = app;
