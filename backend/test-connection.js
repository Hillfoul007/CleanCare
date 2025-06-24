const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
    const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      console.error(
        "MongoDB credentials must be provided via environment variables",
      );
      process.exit(1);
    }
    const MONGODB_CLUSTER = process.env.MONGODB_CLUSTER;
    const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

    if (!MONGODB_CLUSTER || !MONGODB_DATABASE) {
      console.error(
        "MONGODB_CLUSTER and MONGODB_DATABASE environment variables are required",
      );
      process.exit(1);
    }

    const mongoURI = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DATABASE}?retryWrites=true&w=majority`;

    console.log("🔄 Testing MongoDB connection...");
    console.log(`📍 Cluster: ${MONGODB_CLUSTER}`);
    console.log(`📚 Database: ${MONGODB_DATABASE}`);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📚 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);

    // Test creating a simple document
    const testSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now },
    });

    const TestModel = mongoose.model("ConnectionTest", testSchema);

    const testDoc = new TestModel({
      message: "Backend connection test successful!",
    });

    await testDoc.save();
    console.log(`📝 Test document created with ID: ${testDoc._id}`);

    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log(`🗑 Test document cleaned up`);

    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed");
    console.log("🎉 All tests passed! MongoDB is working correctly.");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    if (error.cause) {
      console.error("❌ Root cause:", error.cause.message);
    }
    process.exit(1);
  }
}

testConnection();
