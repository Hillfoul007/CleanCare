import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ConfigStatus = () => {
  // For MongoDB, we'll assume it's always configured since we have the connection string
  const isMongoDBConfigured = true;

  if (isMongoDBConfigured) {
    return null; // Don't show anything when properly configured
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertDescription className="text-amber-800">
        ⚙️ <strong>Database Configuration:</strong> MongoDB connection is not
        properly configured. Please check your connection settings.
      </AlertDescription>
    </Alert>
  );
};

export default ConfigStatus;
