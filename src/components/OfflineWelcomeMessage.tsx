import React, { useState } from "react";
import { X, Smartphone, Database, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const OfflineWelcomeMessage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    // Show welcome message only if user hasn't seen it before and we're in offline mode
    const isOfflineMode =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    const hasSeenWelcome =
      localStorage.getItem("offline_welcome_seen") === "true";
    return isOfflineMode && !hasSeenWelcome;
  });

  const handleDismiss = () => {
    localStorage.setItem("offline_welcome_seen", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-blue-100 p-4 sm:p-6 max-w-sm sm:max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="text-center mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Welcome to HomeServices Pro
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            Demo Mode - Fully Functional Without Backend
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Phone Authentication
              </p>
              <p className="text-xs text-gray-600">
                Sign in with any phone number + any 6-digit OTP
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Service Booking
              </p>
              <p className="text-xs text-gray-600">
                Book services and view booking history
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Local Storage</p>
              <p className="text-xs text-gray-600">
                All data stored locally in your browser
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-blue-800 text-xs font-medium">
            💡 This is a complete demo of the HomeServices platform. In
            production, all data would be stored in MongoDB.
          </p>
        </div>

        <Button
          onClick={handleDismiss}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Start Demo
        </Button>

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default OfflineWelcomeMessage;
