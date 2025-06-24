const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

let db = null;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to ensure DB connection
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({
      success: false,
      error: "Database not connected",
    });
  }
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    mongodb: !!db,
  });
});

// User endpoints
app.post("/api/users", async (req, res) => {
  try {
    const userData = req.body;
    const users = db.collection("users");

    const result = await users.findOneAndUpdate(
      { phone: userData.phone },
      {
        $set: {
          ...userData,
          updatedAt: new Date().toISOString(),
        },
      },
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
      error: error.message,
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
      error: error.message,
    });
  }
});

app.put("/api/users/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const updates = req.body;
    const users = db.collection("users");

    const result = await users.findOneAndUpdate(
      { phone },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
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
      error: error.message,
    });
  }
});

// Booking endpoints
app.post("/api/bookings", async (req, res) => {
  try {
    const bookingData = req.body;
    const bookings = db.collection("bookings");

    const result = await bookings.findOneAndUpdate(
      { id: bookingData.id },
      {
        $set: {
          ...bookingData,
          updatedAt: new Date().toISOString(),
        },
      },
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
      error: error.message,
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
      .toArray();

    res.json({
      success: true,
      data: userBookings,
    });
  } catch (error) {
    console.error("Error getting user bookings:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.put("/api/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;
    const bookings = db.collection("bookings");

    const result = await bookings.findOneAndUpdate(
      { id: bookingId },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
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
      error: error.message,
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
      error: error.message,
    });
  }
});

// Start server
async function startServer() {
  const dbConnected = await connectToMongoDB();

  if (!dbConnected) {
    console.warn("⚠️ Starting server without MongoDB connection");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer();

module.exports = app;
