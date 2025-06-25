// MongoDB setup script for production
const mongoose = require("mongoose");
require("dotenv").config();

async function setupDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Create indexes for better performance
    const db = mongoose.connection.db;

    // Users collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ phone: 1 }, { unique: true });
    await db.collection("users").createIndex({ user_type: 1 });

    // Bookings collection indexes
    await db.collection("bookings").createIndex({ customer_id: 1 });
    await db.collection("bookings").createIndex({ status: 1 });
    await db.collection("bookings").createIndex({ created_at: -1 });
    await db
      .collection("bookings")
      .createIndex({ "coordinates.lat": 1, "coordinates.lng": 1 });

    console.log("✅ Database indexes created successfully");

    await mongoose.disconnect();
    console.log("✅ Database setup completed");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
