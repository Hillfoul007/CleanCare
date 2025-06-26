import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = "",
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkBackendStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setBackendStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial backend check
    if (isOnline) {
      checkBackendStatus();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

 const checkBackendStatus = async () => {
  try {
    setBackendStatus("checking");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/health`,
      {
        signal: controller.signal,
        method: "GET",
      }
    );

    clearTimeout(timeoutId);
    setBackendStatus(response.ok ? "online" : "offline");
  } catch (error) {
    setBackendStatus("offline");
  }
};


  // Don't show anything if everything is working normally
  if (isOnline && backendStatus === "online") {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: "Offline",
        color: "bg-red-100 text-red-800",
        description: "No internet connection",
      };
    }

    if (backendStatus === "offline") {
      return {
        icon: CloudOff,
        text: "Local Mode",
        color: "bg-yellow-100 text-yellow-800",
        description: "Data saved locally",
      };
    }

    if (backendStatus === "checking") {
      return {
        icon: Cloud,
        text: "Connecting...",
        color: "bg-blue-100 text-blue-800",
        description: "Checking connection",
      };
    }

    return {
      icon: Wifi,
      text: "Online",
      color: "bg-green-100 text-green-800",
      description: "Connected",
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <Badge
        variant="outline"
        className={`${statusInfo.color} flex items-center gap-2 px-3 py-1 shadow-lg`}
      >
        <StatusIcon className="h-3 w-3" />
        <span className="text-xs font-medium">{statusInfo.text}</span>
      </Badge>
    </div>
  );
};

export default ConnectionStatus;
