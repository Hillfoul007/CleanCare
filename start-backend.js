// Simple script to start backend server
const { spawn } = require("child_process");

console.log("🚀 Starting backend server...");

const backend = spawn("node", ["server/complete-server.js"], {
  stdio: "inherit",
  env: { ...process.env },
});

backend.on("error", (err) => {
  console.error("❌ Backend error:", err);
});

backend.on("close", (code) => {
  console.log(`Backend exited with code ${code}`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down backend...");
  backend.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down backend...");
  backend.kill();
  process.exit(0);
});
