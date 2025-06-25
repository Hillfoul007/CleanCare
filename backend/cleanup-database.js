const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Booking = require("./models/Booking");
const Rider = require("./models/Rider");

async function cleanupDatabase() {
  try {
    console.log("🔗 Connecting to MongoDB...");

    const mongoUri =
      process.env.MONGODB_URI ||
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    console.log("🗑️ Cleaning up database...");

    // Clear all collections
    await User.deleteMany({});
    console.log("✅ Users collection cleared");

    await Booking.deleteMany({});
    console.log("✅ Bookings collection cleared");

    await Rider.deleteMany({});
    console.log("✅ Riders collection cleared");

    console.log("🎉 Database cleanup completed successfully!");
    console.log("📊 All collections are now empty and ready for fresh data");
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run cleanup
cleanupDatabase();
