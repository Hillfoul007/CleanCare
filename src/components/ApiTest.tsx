import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setStatus("Testing...");

    try {
      // Test health endpoint
      const healthResponse = await fetch("http://localhost:3001/api/health");
      const healthData = await healthResponse.json();

      if (healthData.status === "ok") {
        setStatus("✅ Backend is running correctly!");
      } else {
        setStatus("❌ Backend health check failed");
      }
    } catch (error) {
      setStatus(
        "❌ Cannot connect to backend. Make sure server is running on port 3001.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold mb-2">API Status</h3>
        <p className="text-sm text-gray-600 mb-3">{status || "Not tested"}</p>
        <Button
          onClick={testAPI}
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? "Testing..." : "Test API"}
        </Button>
      </div>
    </div>
  );
};

export default ApiTest;
