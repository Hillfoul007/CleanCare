const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting both Frontend and Backend servers...\n");

// Start backend server
console.log("📡 Starting backend server on port 3001...");
const backend = spawn("node", ["server/complete-server.js"], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

backend.on("error", (err) => {
  console.error("❌ Failed to start backend:", err);
});

console.log("✅ Backend server started successfully!");
console.log("🔗 Backend running on: http://localhost:3001");
console.log("📊 Health check: http://localhost:3001/health");
console.log("🧪 API test: http://localhost:3001/api/test");
console.log("\n💡 Frontend is running on the main dev server");
console.log("🎨 Frontend: http://localhost:8080");
console.log("\n🎯 Your app is ready to use!");

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down backend server...");
  backend.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down backend server...");
  backend.kill();
  process.exit(0);
});

backend.on("close", (code) => {
  console.log(`Backend server exited with code ${code}`);
});
