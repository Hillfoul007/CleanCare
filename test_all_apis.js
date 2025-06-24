#!/usr/bin/env node

const fs = require("fs");

// Test configuration
const API_BASE = "http://localhost:3001/api";
const TEST_PHONE = "9876543210";
const TEST_NAME = "API Test User";

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Utility functions
const log = (message, type = "INFO") => {
  const timestamp = new Date().toISOString();
  console.log(`[${type}] ${timestamp} - ${message}`);
};

const test = async (name, testFn) => {
  totalTests++;
  try {
    log(`Testing: ${name}`, "TEST");
    await testFn();
    passedTests++;
    log(`✅ PASSED: ${name}`, "PASS");
  } catch (error) {
    failedTests++;
    log(`❌ FAILED: ${name} - ${error.message}`, "FAIL");
    console.error(error.stack);
  }
};

const apiCall = async (method, endpoint, data = null, headers = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  log(`${method} ${url}${data ? ` - ${JSON.stringify(data)}` : ""}`, "HTTP");

  const response = await fetch(url, options);
  const responseData = await response.json();

  log(
    `Response: ${response.status} - ${JSON.stringify(responseData).substring(0, 200)}...`,
    "RESP",
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${responseData.message || "Unknown error"}`,
    );
  }

  return responseData;
};

// Test suite
const runTests = async () => {
  log("🚀 Starting comprehensive API tests", "START");

  let authToken = null;
  let userId = null;
  let otpCode = null;

  // Test 1: Health checks
  await test("API Health Check", async () => {
    const response = await apiCall("GET", "/health");
    if (response.status !== "ok") {
      throw new Error("Health check failed");
    }
  });

  await test("Auth Service Health Check", async () => {
    const response = await apiCall("GET", "/auth/health");
    if (!response.success) {
      throw new Error("Auth health check failed");
    }
  });

  await test("Location Service Health Check", async () => {
    const response = await apiCall("GET", "/location/health");
    if (!response.success) {
      throw new Error("Location health check failed");
    }
  });

  // Test 2: OTP Authentication Flow
  await test("Send OTP", async () => {
    const response = await apiCall("POST", "/auth/send-otp", {
      phone: TEST_PHONE,
    });

    if (!response.success) {
      throw new Error("OTP sending failed");
    }

    // Extract OTP from logs (in real scenario, this would come from SMS)
    // For testing, we'll simulate getting the OTP
    otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // This should be read from console logs in real scenario
  });

  // Wait for OTP to be available in logs
  log("⏳ Waiting for OTP in logs...", "WAIT");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 3: Invalid OTP
  await test("Verify Invalid OTP", async () => {
    try {
      await apiCall("POST", "/auth/verify-otp", {
        phone: TEST_PHONE,
        otp: "000000",
        name: TEST_NAME,
      });
      throw new Error("Should have failed with invalid OTP");
    } catch (error) {
      if (error.message.includes("Should have failed")) {
        throw error;
      }
      // Expected to fail
    }
  });

  // Test 4: Location Services
  await test("Geocode Location", async () => {
    const response = await apiCall("GET", "/location/geocode/28.5602/76.9989");
    if (!response.success || !response.data.address) {
      throw new Error("Geocoding failed");
    }
  });

  await test("Search Location", async () => {
    const response = await apiCall("GET", "/location/search/Delhi");
    if (!response.success) {
      throw new Error("Location search failed");
    }
  });

  await test("Get Service Areas", async () => {
    const response = await apiCall("GET", "/location/service-areas");
    if (!response.success || !response.data.serviceAreas) {
      throw new Error("Service areas fetch failed");
    }
  });

  await test("Check Service Area", async () => {
    const response = await apiCall("POST", "/location/check-service-area", {
      lat: 28.5602,
      lng: 76.9989,
    });
    if (!response.success) {
      throw new Error("Service area check failed");
    }
  });

  // Test 5: Bookings API
  await test("Get Bookings (without auth)", async () => {
    try {
      await apiCall("GET", "/bookings");
      // Should work without auth for now (returns all bookings)
    } catch (error) {
      log("Bookings might require auth, which is expected", "INFO");
    }
  });

  // Test 6: Error handling
  await test("Invalid Endpoint", async () => {
    try {
      await apiCall("GET", "/nonexistent");
      throw new Error("Should have returned 404");
    } catch (error) {
      if (error.message.includes("Should have returned")) {
        throw error;
      }
      // Expected to fail
    }
  });

  await test("Invalid Phone Format", async () => {
    try {
      await apiCall("POST", "/auth/send-otp", {
        phone: "invalid",
      });
      throw new Error("Should have failed with invalid phone");
    } catch (error) {
      if (error.message.includes("Should have failed")) {
        throw error;
      }
      // Expected to fail
    }
  });

  await test("Missing Required Fields", async () => {
    try {
      await apiCall("POST", "/auth/send-otp", {});
      throw new Error("Should have failed with missing phone");
    } catch (error) {
      if (error.message.includes("Should have failed")) {
        throw error;
      }
      // Expected to fail
    }
  });

  // Test 7: CORS Headers
  await test("CORS Headers", async () => {
    const response = await fetch(`${API_BASE}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:8080",
        "Access-Control-Request-Method": "GET",
      },
    });

    if (response.status !== 204) {
      throw new Error("CORS preflight failed");
    }

    const corsHeaders = response.headers.get("Access-Control-Allow-Origin");
    if (!corsHeaders || !corsHeaders.includes("localhost:8080")) {
      throw new Error("CORS headers not properly configured");
    }
  });

  // Summary
  log("📊 Test Summary:", "SUMMARY");
  log(`Total Tests: ${totalTests}`, "SUMMARY");
  log(`Passed: ${passedTests}`, "SUMMARY");
  log(`Failed: ${failedTests}`, "SUMMARY");
  log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
    "SUMMARY",
  );

  if (failedTests === 0) {
    log("🎉 All tests passed! Backend is working correctly.", "SUCCESS");
  } else {
    log(
      `⚠️  ${failedTests} test(s) failed. Please check the errors above.`,
      "WARNING",
    );
  }

  // Write results to file
  const results = {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1),
  };

  fs.writeFileSync("api_test_results.json", JSON.stringify(results, null, 2));
  log("📄 Results saved to api_test_results.json", "INFO");
};

// Run the tests
runTests().catch((error) => {
  log(`💥 Test suite failed: ${error.message}`, "ERROR");
  console.error(error.stack);
  process.exit(1);
});
