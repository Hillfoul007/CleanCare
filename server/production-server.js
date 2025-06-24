const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

let db = null;
let isConnected = false;

// Connect to MongoDB with retry logic
async function connectToMongoDB(retries = 5) {
  try {
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db();
    isConnected = true;
    console.log("✅ Connected to MongoDB Atlas");

    // Create indexes for better performance
    await createIndexes();

    return true;
  } catch (error) {
    console.error(
      `❌ MongoDB connection failed (${retries} retries left):`,
      error.message,
    );

    if (retries > 0) {
      console.log("🔄 Retrying connection in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectToMongoDB(retries - 1);
    }

    return false;
  }
}

// Create database indexes
async function createIndexes() {
  try {
    if (!db) return;

    // Users collection indexes
    await db.collection("users").createIndex({ phone: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { sparse: true });

    // Bookings collection indexes
    await db.collection("bookings").createIndex({ id: 1 }, { unique: true });
    await db.collection("bookings").createIndex({ userId: 1 });
    await db.collection("bookings").createIndex({ status: 1 });
    await db.collection("bookings").createIndex({ createdAt: -1 });

    console.log("✅ Database indexes created");
  } catch (error) {
    console.warn("⚠️ Index creation warning:", error.message);
  }
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

// Compression
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://your-frontend-domain.vercel.app", // UPDATE THIS
      "https://your-frontend-domain.netlify.app", // UPDATE THIS
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check middleware
app.use((req, res, next) => {
  if (req.path === "/api/health") {
    return next();
  }

  if (!isConnected) {
    return res.status(503).json({
      success: false,
      error: "Database connection unavailable",
      status: "unhealthy",
    });
  }
  next();
});

// Request logging in production
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb: isConnected,
    uptime: process.uptime(),
  };

  // Test MongoDB connection
  if (isConnected && db) {
    try {
      await db.admin().ping();
      health.mongodb = true;
    } catch (error) {
      health.mongodb = false;
      health.status = "degraded";
    }
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json({ success: true, data: health });
});

// User endpoints
app.post("/api/users", async (req, res) => {
  try {
    const userData = {
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const users = db.collection("users");

    const result = await users.findOneAndUpdate(
      { phone: userData.phone },
      { $set: userData },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    res.json({
      success: true,
      data: result.value,
    });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save user",
    });
  }
});

app.get("/api/users/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const users = db.collection("users");

    const user = await users.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
});

app.put("/api/users/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const users = db.collection("users");

    const result = await users.findOneAndUpdate(
      { phone },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: result.value,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
});

// Booking endpoints
app.post("/api/bookings", async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bookings = db.collection("bookings");

    const result = await bookings.findOneAndUpdate(
      { id: bookingData.id },
      { $set: bookingData },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    res.json({
      success: true,
      data: result.value,
    });
  } catch (error) {
    console.error("Error saving booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save booking",
    });
  }
});

app.get("/api/bookings/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = db.collection("bookings");

    const userBookings = await bookings
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100) // Limit for performance
      .toArray();

    res.json({
      success: true,
      data: userBookings,
    });
  } catch (error) {
    console.error("Error getting user bookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get bookings",
    });
  }
});

app.put("/api/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const bookings = db.collection("bookings");

    const result = await bookings.findOneAndUpdate(
      { id: bookingId },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.json({
      success: true,
      data: result.value,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update booking",
    });
  }
});

app.delete("/api/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const bookings = db.collection("bookings");

    const result = await bookings.deleteOne({ id: bookingId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete booking",
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
async function startServer() {
  console.log("🚀 Starting CleanCare Laundry API Server...");
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);

  const dbConnected = await connectToMongoDB();

  if (!dbConnected) {
    console.error(
      "❌ Failed to connect to MongoDB. Server will start but API will be unavailable.",
    );
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 MongoDB: ${isConnected ? "Connected" : "Disconnected"}`);
  });
}

startServer();

module.exports = app;
