import React, { useState, useEffect } from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackendErrorBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
}

const BackendErrorBanner: React.FC<BackendErrorBannerProps> = ({
  isVisible: initialVisible = true,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    // Reload the page to retry all connections
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium text-sm">
              ⚠️ Backend Connectivity Issues
            </p>
            <p className="text-xs opacity-90">
              Some features may be limited. The app will work in offline mode
              with local storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </>
            )}
          </Button>

          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendErrorBanner;
