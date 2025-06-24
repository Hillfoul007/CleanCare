import React, { useState } from "react";
import { X, Info } from "lucide-react";

const DemoStatusBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5" />
          <div>
            <p className="font-medium text-sm">🎯 Demo Mode Active</p>
            <p className="text-xs opacity-90">
              This is a demonstration - no real payments or services will be
              processed
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DemoStatusBanner;
