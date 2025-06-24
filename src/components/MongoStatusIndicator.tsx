import React, { useState, useEffect } from "react";
import { Database, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { adaptiveApi } from "../utils/adaptiveApiClient";

const MongoStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking",
  );
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    const apiStatus = adaptiveApi.getStatus();
    const result = await adaptiveApi.checkEmail("test@test.com");

    if (result.data && !result.isOffline) {
      setStatus("connected");
      setInfo({
        message: "MongoDB Backend Connected",
      });
    } else if (result.isOffline) {
      setStatus("error");
      setInfo({
        message: "Offline Mode",
        error: "Backend not accessible - using local storage",
      });
    } else {
      setStatus("error");
      setInfo({
        message: "Backend Error",
        error: result.error || "Unknown error",
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}
    >
      <Database className="w-3 h-3" />
      {getStatusIcon()}
      <span className="hidden lg:inline">
        {status === "checking" && "Checking MongoDB..."}
        {status === "connected" && "MongoDB Connected"}
        {status === "error" && "MongoDB Error"}
      </span>
      <span className="lg:hidden">
        {status === "checking" && "Checking..."}
        {status === "connected" && "DB OK"}
        {status === "error" && "DB Error"}
      </span>
    </div>
  );
};

export default MongoStatusIndicator;
