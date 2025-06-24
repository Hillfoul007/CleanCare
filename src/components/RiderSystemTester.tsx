import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Database,
  User,
  MapPin,
  Car,
  CreditCard,
  Phone,
  AlertTriangle,
} from "lucide-react";
import RidersService from "@/services/ridersService";
import { CreateRiderRequest, CreateDeliveryRequest } from "@/types/riders";
import { supabase } from "@/integrations/supabase/client";
import { ErrorHandler } from "@/services/errorHandling";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  duration?: number;
  error?: any;
}

const RiderSystemTester: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<
    "idle" | "running" | "completed"
  >("idle");

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test)),
    );
  };

  const testDefinitions = [
    {
      name: "Database Connection",
      icon: <Database className="w-4 h-4" />,
      test: async () => {
        const { data, error } = await supabase
          .from("riders")
          .select("count")
          .limit(1);
        if (error) throw error;
        return "Database connection successful";
      },
    },
    {
      name: "Authentication Check",
      icon: <User className="w-4 h-4" />,
      test: async () => {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        return user
          ? `Authenticated as ${user.email}`
          : "No user authenticated";
      },
    },
    {
      name: "Riders Table Structure",
      icon: <Database className="w-4 h-4" />,
      test: async () => {
        const { data, error } = await supabase
          .from("riders")
          .select("id, full_name, email, phone, vehicle_type, status")
          .limit(1);
        if (error) throw error;
        return "Riders table accessible";
      },
    },
    {
      name: "Location Functions",
      icon: <MapPin className="w-4 h-4" />,
      test: async () => {
        const { data, error } = await supabase.rpc("calculate_distance_km", {
          lat1: 28.6315,
          lng1: 77.2167,
          lat2: 28.6139,
          lng2: 77.209,
        });
        if (error) throw error;
        return `Distance calculation works: ${data} km`;
      },
    },
    {
      name: "Find Available Riders",
      icon: <Car className="w-4 h-4" />,
      test: async () => {
        const { data, error } = await RidersService.findAvailableRiders(
          { lat: 28.6315, lng: 77.2167 },
          15,
        );
        if (error) throw error;
        return `Found ${data?.length || 0} available riders`;
      },
    },
    {
      name: "Create Test Rider",
      icon: <User className="w-4 h-4" />,
      test: async () => {
        const testRider: CreateRiderRequest = {
          full_name: "Test Rider " + Date.now(),
          email: `test.rider.${Date.now()}@example.com`,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          vehicle_type: "motorcycle",
          license_number: "TEST" + Date.now(),
          base_location: "Delhi",
          base_coordinates: { lat: 28.6315, lng: 77.2167 },
          service_radius_km: 15,
        };

        const { data, error } = await RidersService.createRider(testRider);
        if (error) throw error;

        // Clean up test rider
        if (data?.id) {
          await supabase.from("riders").delete().eq("id", data.id);
        }

        return `Test rider created and cleaned up successfully`;
      },
    },
    {
      name: "Update Rider Location",
      icon: <MapPin className="w-4 h-4" />,
      test: async () => {
        // Get first available rider for testing
        const { data: riders } = await supabase
          .from("riders")
          .select("id")
          .limit(1);

        if (!riders || riders.length === 0) {
          throw new Error("No riders available for testing");
        }

        const { data, error } = await RidersService.updateRiderLocation(
          riders[0].id,
          "Test Location Update",
          { lat: 28.6315, lng: 77.2167 },
        );

        if (error) throw error;
        return "Rider location updated successfully";
      },
    },
    {
      name: "Toggle Rider Status",
      icon: <RefreshCw className="w-4 h-4" />,
      test: async () => {
        // Get first available rider for testing
        const { data: riders } = await supabase
          .from("riders")
          .select("id, is_online")
          .limit(1);

        if (!riders || riders.length === 0) {
          throw new Error("No riders available for testing");
        }

        const rider = riders[0];
        const newStatus = !rider.is_online;

        const { data, error } = await RidersService.toggleOnlineStatus(
          rider.id,
          newStatus,
          "Test Location",
          { lat: 28.6315, lng: 77.2167 },
        );

        if (error) throw error;

        // Revert status
        await RidersService.toggleOnlineStatus(rider.id, rider.is_online);

        return `Rider status toggled successfully`;
      },
    },
    {
      name: "Create Delivery Request",
      icon: <CreditCard className="w-4 h-4" />,
      test: async () => {
        const testDelivery: CreateDeliveryRequest = {
          pickup_address: "Connaught Place, New Delhi",
          pickup_coordinates: { lat: 28.6315, lng: 77.2167 },
          delivery_address: "India Gate, New Delhi",
          delivery_coordinates: { lat: 28.6139, lng: 77.209 },
          package_description: "Test Package",
          delivery_type: "standard",
          payment_method: "cash",
        };

        const { data, error } =
          await RidersService.createDeliveryRequest(testDelivery);
        if (error) throw error;

        // Clean up test delivery
        if (data?.id) {
          await supabase.from("delivery_requests").delete().eq("id", data.id);
        }

        return `Test delivery request created and cleaned up`;
      },
    },
    {
      name: "Rider Earnings Query",
      icon: <CreditCard className="w-4 h-4" />,
      test: async () => {
        // Get first available rider for testing
        const { data: riders } = await supabase
          .from("riders")
          .select("id")
          .limit(1);

        if (!riders || riders.length === 0) {
          throw new Error("No riders available for testing");
        }

        const { data, error } = await RidersService.getRiderEarnings(
          riders[0].id,
        );
        if (error) throw error;

        return `Earnings query successful: ${data?.length || 0} records`;
      },
    },
    {
      name: "Rider Statistics",
      icon: <Database className="w-4 h-4" />,
      test: async () => {
        const { data, error } = await RidersService.getRiderStats();
        if (error) throw error;

        return `Stats retrieved: ${data?.total_riders || 0} total riders`;
      },
    },
    {
      name: "Error Handling Test",
      icon: <AlertTriangle className="w-4 h-4" />,
      test: async () => {
        try {
          // Intentionally trigger an error to test error handling
          await supabase.from("non_existent_table").select("*");
        } catch (error) {
          const errorDetails = ErrorHandler.handleDatabaseError(
            error,
            "Error Handling Test",
          );
          if (errorDetails.code === "TABLE_NOT_FOUND") {
            return "Error handling working correctly";
          }
          throw new Error("Error handling not working as expected");
        }
        throw new Error("Expected error was not thrown");
      },
    },
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus("running");

    const initialTests = testDefinitions.map((def) => ({
      name: def.name,
      status: "pending" as const,
      message: "Waiting to run...",
    }));

    setTests(initialTests);

    for (let i = 0; i < testDefinitions.length; i++) {
      const testDef = testDefinitions[i];
      const startTime = Date.now();

      updateTest(i, { status: "running", message: "Running..." });

      try {
        const result = await testDef.test();
        const duration = Date.now() - startTime;

        updateTest(i, {
          status: "success",
          message: result,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Test "${testDef.name}" failed:`, error);

        updateTest(i, {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
          duration,
          error,
        });
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setOverallStatus("completed");
  };

  const runSingleTest = async (index: number) => {
    const testDef = testDefinitions[index];
    const startTime = Date.now();

    updateTest(index, { status: "running", message: "Running..." });

    try {
      const result = await testDef.test();
      const duration = Date.now() - startTime;

      updateTest(index, {
        status: "success",
        message: result,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Test "${testDef.name}" failed:`, error);

      updateTest(index, {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration,
        error,
      });
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "running":
        return <Clock className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            Running
          </Badge>
        );
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const successCount = tests.filter((t) => t.status === "success").length;
  const errorCount = tests.filter((t) => t.status === "error").length;
  const totalTests = tests.length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Rider System Test Suite</span>
          </CardTitle>
          <p className="text-gray-600">
            Comprehensive testing of all rider system buttons and functionality
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isRunning ? "Running Tests..." : "Run All Tests"}
              </Button>

              {overallStatus === "completed" && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-500">
                    {successCount} Passed
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} Failed</Badge>
                  )}
                  <span className="text-sm text-gray-600">
                    of {totalTests} tests
                  </span>
                </div>
              )}
            </div>
          </div>

          {overallStatus === "completed" && (
            <Alert
              className={`mb-6 ${errorCount === 0 ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
            >
              <AlertDescription
                className={
                  errorCount === 0 ? "text-green-800" : "text-orange-800"
                }
              >
                {errorCount === 0 ? (
                  <span>
                    🎉 All tests passed! Your rider system is working correctly.
                  </span>
                ) : (
                  <span>
                    ⚠️ {errorCount} test(s) failed. Please check the errors
                    below and fix any issues.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testDefinitions.map((testDef, index) => {
              const testResult = tests[index];
              const isTestRunning = testResult?.status === "running";

              return (
                <Card
                  key={index}
                  className={`border ${
                    testResult?.status === "success"
                      ? "border-green-200 bg-green-50"
                      : testResult?.status === "error"
                        ? "border-red-200 bg-red-50"
                        : testResult?.status === "running"
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {testDef.icon}
                        <span className="font-medium text-sm">
                          {testDef.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {testResult && getStatusBadge(testResult.status)}
                        {testResult && getStatusIcon(testResult.status)}
                      </div>
                    </div>

                    {testResult && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                          {testResult.message}
                        </p>
                        {testResult.duration && (
                          <p className="text-xs text-gray-500">
                            Duration: {testResult.duration}ms
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleTest(index)}
                        disabled={isRunning || isTestRunning}
                        className="text-xs"
                      >
                        {isTestRunning ? "Running..." : "Run Test"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderSystemTester;
