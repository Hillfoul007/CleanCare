const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

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
    message: "Unified server running",
    services: ["frontend", "api"],
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Unified API is working!",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/auth/verify-token",
      "GET /api/auth/profile",
      "POST /api/bookings",
      "GET /api/bookings/customer/:id",
      "GET /api/riders/profile/:userId",
      "POST /api/riders/profile",
    ],
  });
});

// AUTH ROUTES
const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, userType = "customer" } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const mockUser = {
      _id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      full_name: name,
      phone,
      user_type: userType,
      created_at: new Date(),
      updated_at: new Date(),
      is_verified: false,
    };

    const mockToken = `jwt_${Date.now()}`;

    res.status(201).json({
      message: "User registered successfully",
      user: mockUser,
      token: mockToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const mockUser = {
      _id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      full_name: "Demo User",
      phone: "+1234567890",
      user_type: "customer",
      created_at: new Date(),
      updated_at: new Date(),
      is_verified: true,
    };

    const mockToken = `jwt_${Date.now()}`;

    res.json({
      message: "Login successful",
      user: mockUser,
      token: mockToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    if (token.startsWith("jwt_")) {
      const mockUser = {
        _id: `user_from_token_${Date.now()}`,
        email: "demo@example.com",
        full_name: "Demo User",
        phone: "+1234567890",
        user_type: "customer",
        created_at: new Date(),
        updated_at: new Date(),
        is_verified: true,
      };

      res.json({
        valid: true,
        user: mockUser,
      });
    } else {
      res.status(401).json({
        error: "Invalid or expired token",
        valid: false,
      });
    }
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/profile", async (req, res) => {
  try {
    const mockUser = {
      _id: "demo_user_123",
      email: "demo@example.com",
      full_name: "Demo User",
      phone: "+1234567890",
      user_type: "customer",
      created_at: new Date(),
      updated_at: new Date(),
      is_verified: true,
    };

    res.json({ user: mockUser });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.json({ message: "Logout successful" });
});

authRouter.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/check-phone", async (req, res) => {
  try {
    const { phone } = req.body;
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/auth", authRouter);

// BOOKING ROUTES
const bookingRouter = express.Router();

bookingRouter.post("/", async (req, res) => {
  try {
    const bookingData = req.body;

    const mockBooking = {
      _id: `booking_${Date.now()}`,
      ...bookingData,
      status: "pending",
      payment_status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    res.status(201).json({
      message: "Booking created successfully",
      booking: mockBooking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

bookingRouter.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const mockBookings = [
      {
        _id: `booking_${Date.now()}`,
        customer_id: customerId,
        service: "House Cleaning",
        service_type: "Household Services",
        services: ["Deep Cleaning"],
        scheduled_date: new Date().toISOString().split("T")[0],
        scheduled_time: "2:00 PM",
        provider_name: "CleanPro Services",
        address: "123 Demo Street",
        total_price: 80,
        final_amount: 80,
        status: "pending",
        payment_status: "pending",
        created_at: new Date(),
      },
    ];

    res.json({ bookings: mockBookings });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

bookingRouter.put("/:bookingId/status", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const mockUpdatedBooking = {
      _id: bookingId,
      status: status,
      updated_at: new Date(),
    };

    res.json({
      message: "Booking status updated successfully",
      booking: mockUpdatedBooking,
    });
  } catch (error) {
    console.error("Booking update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

bookingRouter.put("/:bookingId/accept", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rider_id } = req.body;

    const mockUpdatedBooking = {
      _id: bookingId,
      rider_id: rider_id,
      status: "confirmed",
      updated_at: new Date(),
    };

    res.json({
      message: "Booking accepted successfully",
      booking: mockUpdatedBooking,
    });
  } catch (error) {
    console.error("Booking acceptance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/bookings", bookingRouter);

// RIDER ROUTES
const riderRouter = express.Router();

riderRouter.post("/profile", async (req, res) => {
  try {
    const riderData = req.body;

    const mockRider = {
      _id: `rider_${Date.now()}`,
      ...riderData,
      rating: 5.0,
      completed_rides: 0,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    res.status(201).json({
      message: "Rider profile created successfully",
      rider: mockRider,
    });
  } catch (error) {
    console.error("Rider profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

riderRouter.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    res.json({ rider: null });
  } catch (error) {
    console.error("Rider profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

riderRouter.put("/:riderId/status", async (req, res) => {
  try {
    const { riderId } = req.params;
    const updateData = req.body;

    const mockRider = {
      _id: riderId,
      ...updateData,
      updated_at: new Date(),
    };

    res.json({
      message: "Rider status updated successfully",
      rider: mockRider,
    });
  } catch (error) {
    console.error("Rider status update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

riderRouter.get("/online", async (req, res) => {
  try {
    res.json({ riders: [] });
  } catch (error) {
    console.error("Online riders fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/riders", riderRouter);

// Serve static files from dist folder (for production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  // Fallback to index.html for SPA routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// 404 handler for API routes only in development
if (process.env.NODE_ENV !== "production") {
  app.use("/api/*", (req, res) => {
    console.log(
      `404 - API endpoint not found: ${req.method} ${req.originalUrl}`,
    );
    res.status(404).json({
      error: "API endpoint not found",
      method: req.method,
      url: req.originalUrl,
      available_endpoints: [
        "GET /health",
        "GET /api/test",
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/verify-token",
        "GET /api/auth/profile",
        "POST /api/bookings",
        "GET /api/bookings/customer/:id",
        "POST /api/riders/profile",
        "GET /api/riders/profile/:userId",
      ],
    });
  });
}

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Unified server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Frontend and API ready on same port`);
  console.log(`📋 API endpoints available at /api/*`);
});

module.exports = app;
