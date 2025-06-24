const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import MongoDB models
const User = require("../server/models/User");
const Booking = require("../server/models/Booking");
const Rider = require("../server/models/Rider");

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB connection
const connectDB = async () => {
  try {
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const cluster = process.env.MONGODB_CLUSTER;
    const database = process.env.MONGODB_DATABASE;

    if (!username || !password || !cluster || !database) {
      throw new Error(
        "MongoDB credentials (USERNAME, PASSWORD, CLUSTER, DATABASE) must be provided via environment variables",
      );
    }

    const mongoURI = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;

    console.log("🔗 Connecting to MongoDB...");

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected Successfully`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("⚠️ Falling back to mock data mode");
  }
};

// Connect to MongoDB
connectDB();

// Basic middleware
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, "../dist")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "MongoDB-integrated server running",
    mongodb:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    services: ["frontend", "api", "mongodb"],
  });
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "MongoDB-integrated API is working!",
    mongodb:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
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

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Real MongoDB operations
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email: email.toLowerCase() }, { phone: phone }],
        });

        if (existingUser) {
          if (existingUser.email === email.toLowerCase()) {
            return res.status(409).json({
              error:
                "An account with this email address already exists. Please sign in instead or use a different email.",
            });
          } else {
            return res.status(409).json({
              error:
                "An account with this phone number already exists. Please use a different phone number.",
            });
          }
        }

        // Create new user
        const user = new User({
          email: email.toLowerCase(),
          password,
          full_name: name,
          phone,
          user_type: userType,
        });

        await user.save();

        // Return user without password
        const userResponse = {
          _id: user._id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          user_type: user.user_type,
          created_at: user.created_at,
          updated_at: user.updated_at,
          is_verified: user.is_verified,
        };

        const mockToken = `jwt_${Date.now()}`;

        res.status(201).json({
          message: "User registered successfully",
          user: userResponse,
          token: mockToken,
        });
      } catch (mongoError) {
        console.error("MongoDB operation failed:", mongoError);

        // Handle duplicate key errors
        if (mongoError.code === 11000) {
          const field = Object.keys(mongoError.keyValue)[0];
          const message =
            field === "email"
              ? "An account with this email address already exists. Please sign in instead or use a different email."
              : "An account with this phone number already exists. Please use a different phone number.";
          return res.status(409).json({ error: message });
        }

        // Fall back to mock response
        throw mongoError;
      }
    } else {
      // Fallback to mock data if MongoDB is not connected
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
        message: "User registered successfully (Mock Mode)",
        user: mockUser,
        token: mockToken,
      });
    }
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

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(401).json({
            error:
              "Invalid email or password. Please check your credentials or sign up for a new account.",
          });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({
            error:
              "Invalid email or password. Please check your credentials or sign up for a new account.",
          });
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        // Return user without password
        const userResponse = {
          _id: user._id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          user_type: user.user_type,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          is_verified: user.is_verified,
        };

        const mockToken = `jwt_${Date.now()}`;

        res.json({
          message: "Login successful",
          user: userResponse,
          token: mockToken,
        });
      } catch (mongoError) {
        console.error("MongoDB login failed:", mongoError);
        throw mongoError;
      }
    } else {
      // Fallback to mock data
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
        message: "Login successful (Mock Mode)",
        user: mockUser,
        token: mockToken,
      });
    }
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

    // For demo purposes, accept any JWT token
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

    if (mongoose.connection.readyState === 1) {
      const exists = await User.emailExists(email);
      res.json({ exists });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/check-phone", async (req, res) => {
  try {
    const { phone } = req.body;

    if (mongoose.connection.readyState === 1) {
      const exists = await User.phoneExists(phone);
      res.json({ exists });
    } else {
      res.json({ exists: false });
    }
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

    if (mongoose.connection.readyState === 1) {
      try {
        // Create booking in MongoDB
        const booking = new Booking({
          ...bookingData,
          status: "pending",
          payment_status: "pending",
        });

        await booking.save();
        await booking.populate("customer_id", "full_name phone email");

        res.status(201).json({
          message: "Booking created successfully",
          booking,
        });
      } catch (mongoError) {
        console.error("MongoDB booking creation failed:", mongoError);
        throw mongoError;
      }
    } else {
      // Fallback to mock data
      const mockBooking = {
        _id: `booking_${Date.now()}`,
        ...bookingData,
        status: "pending",
        payment_status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      };

      res.status(201).json({
        message: "Booking created successfully (Mock Mode)",
        booking: mockBooking,
      });
    }
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

bookingRouter.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    if (mongoose.connection.readyState === 1) {
      try {
        const bookings = await Booking.find({ customer_id: customerId })
          .populate("customer_id", "full_name phone email")
          .populate("rider_id", "full_name phone")
          .sort({ created_at: -1 });

        res.json({ bookings });
      } catch (mongoError) {
        console.error("MongoDB booking fetch failed:", mongoError);
        throw mongoError;
      }
    } else {
      // Fallback to mock data
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
    }
  } catch (error) {
    console.error("Bookings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/bookings", bookingRouter);

// RIDER ROUTES
const riderRouter = express.Router();

riderRouter.post("/profile", async (req, res) => {
  try {
    const riderData = req.body;

    if (mongoose.connection.readyState === 1) {
      try {
        // Check if rider profile already exists
        let rider = await Rider.findOne({ user_id: riderData.user_id });

        if (rider) {
          // Update existing rider
          Object.assign(rider, riderData);
          await rider.save();
        } else {
          // Create new rider profile
          rider = new Rider(riderData);
          await rider.save();
        }

        await rider.populate("user_id", "full_name phone email");

        res.status(201).json({
          message: rider.isNew
            ? "Rider profile created successfully"
            : "Rider profile updated successfully",
          rider,
        });
      } catch (mongoError) {
        console.error("MongoDB rider operation failed:", mongoError);
        throw mongoError;
      }
    } else {
      // Fallback to mock data
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
        message: "Rider profile created successfully (Mock Mode)",
        rider: mockRider,
      });
    }
  } catch (error) {
    console.error("Rider profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

riderRouter.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (mongoose.connection.readyState === 1) {
      try {
        const rider = await Rider.findOne({ user_id: userId }).populate(
          "user_id",
          "full_name phone email",
        );

        res.json({ rider });
      } catch (mongoError) {
        console.error("MongoDB rider fetch failed:", mongoError);
        res.json({ rider: null });
      }
    } else {
      res.json({ rider: null });
    }
  } catch (error) {
    console.error("Rider profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/riders", riderRouter);

// Frontend serving - IMPORTANT: This must come after API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({
      error: "API endpoint not found",
      path: req.path,
    });
  }

  // Serve the React app for all other routes
  res.sendFile(path.join(__dirname, "../dist/index.html"), (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error loading application");
    }
  });
});

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
  console.log(`🚀 MongoDB-integrated server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️ MongoDB: ${mongoose.connection.readyState === 1 ? "Connected" : "Connecting..."}`,
  );
  console.log(`✅ Frontend and API with MongoDB ready`);
});

module.exports = app;
