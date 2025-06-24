import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Database, HardDrive } from "lucide-react";

const OfflineModeIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if we're running on a remote domain (which means offline mode)
    const checkOfflineStatus = () => {
      const isRemoteDomain =
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1";
      setIsOffline(isRemoteDomain);
    };

    checkOfflineStatus();
  }, []);

  if (!isOffline) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-orange-50 border-orange-200 text-orange-800 text-xs font-medium">
      <HardDrive className="w-3 h-3" />
      <WifiOff className="w-3 h-3" />
      <span className="hidden sm:inline">Offline Mode</span>
      <span className="sm:hidden">Offline</span>
    </div>
  );
};

export default OfflineModeIndicator;
