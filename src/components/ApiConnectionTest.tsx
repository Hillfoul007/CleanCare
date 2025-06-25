import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Wifi,
  Database,
} from "lucide-react";

const ApiConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState({
    health: null as boolean | null,
    apiTest: null as boolean | null,
    authEndpoint: null as boolean | null,
    bookingEndpoint: null as boolean | null,
  });
  const [error, setError] = useState("");

  const testConnections = async () => {
    setTesting(true);
    setError("");

    const BACKEND_URL = "http://localhost:3001";

    const newResults = {
      health: null as boolean | null,
      apiTest: null as boolean | null,
      authEndpoint: null as boolean | null,
      bookingEndpoint: null as boolean | null,
    };

    try {
      // Test 1: Health endpoint
      try {
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        newResults.health = healthResponse.ok;
      } catch (error) {
        newResults.health = false;
      }

      // Test 2: API test endpoint
      try {
        const apiResponse = await fetch(`${BACKEND_URL}/api/test`);
        newResults.apiTest = apiResponse.ok;
      } catch (error) {
        newResults.apiTest = false;
      }

      // Test 3: Auth endpoint
      try {
        const authResponse = await fetch(
          `${BACKEND_URL}/api/auth/check-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" }),
          },
        );
        newResults.authEndpoint = authResponse.ok;
      } catch (error) {
        newResults.authEndpoint = false;
      }

      // Test 4: Booking endpoint
      try {
        const bookingResponse = await fetch(
          `${BACKEND_URL}/api/bookings/customer/test123`,
        );
        newResults.bookingEndpoint = bookingResponse.ok;
      } catch (error) {
        newResults.bookingEndpoint = false;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setResults(newResults);
      setTesting(false);
    }
  };

  useEffect(() => {
    testConnections();
  }, []);

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) {
      return (
        <Badge variant="secondary">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Testing...
        </Badge>
      );
    }

    return status ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const allConnected = Object.values(results).every(
    (status) => status === true,
  );
  const anyFailed = Object.values(results).some((status) => status === false);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Backend Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span>Health Check</span>
              <code className="text-xs bg-gray-200 px-1 rounded">/health</code>
            </div>
            {getStatusBadge(results.health)}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>API Test</span>
              <code className="text-xs bg-gray-200 px-1 rounded">
                /api/test
              </code>
            </div>
            {getStatusBadge(results.apiTest)}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Auth Endpoints</span>
              <code className="text-xs bg-gray-200 px-1 rounded">
                /api/auth/*
              </code>
            </div>
            {getStatusBadge(results.authEndpoint)}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>Booking Endpoints</span>
              <code className="text-xs bg-gray-200 px-1 rounded">
                /api/bookings/*
              </code>
            </div>
            {getStatusBadge(results.bookingEndpoint)}
          </div>
        </div>

        {allConnected && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ All backend connections are working! Your app is ready to use.
            </AlertDescription>
          </Alert>
        )}

        {anyFailed && !testing && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ Some connections failed. Make sure the backend server is
              running on Render.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={testConnections}
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Again"}
          </Button>

          {allConnected && (
            <Button className="flex items-center gap-2" asChild>
              <a
                href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:3001"}/health`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Server className="h-4 w-4" />
                View Backend
              </a>
            </Button>
          )}

          <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
            <p>🔧 Backend: {import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}</p>
            <p>📊 Health: /health</p>
            <p>🧪 API Test: /api/test</p>
          </div>