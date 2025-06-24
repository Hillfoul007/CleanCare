import React from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Zap, Globe } from "lucide-react";

interface LocationPrecisionIndicatorProps {
  accuracy?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const LocationPrecisionIndicator: React.FC<LocationPrecisionIndicatorProps> = ({
  accuracy,
  coordinates,
}) => {
  const getPrecisionLevel = (accuracy?: number) => {
    if (!accuracy)
      return {
        level: "unknown",
        color: "gray",
        icon: Globe,
        text: "Location Detected",
      };

    if (accuracy <= 5) {
      return {
        level: "excellent",
        color: "green",
        icon: Target,
        text: "Excellent Precision",
      };
    } else if (accuracy <= 20) {
      return {
        level: "good",
        color: "blue",
        icon: Zap,
        text: "Good Precision",
      };
    } else if (accuracy <= 100) {
      return {
        level: "fair",
        color: "yellow",
        icon: MapPin,
        text: "Fair Precision",
      };
    } else {
      return {
        level: "poor",
        color: "orange",
        icon: Globe,
        text: "Low Precision",
      };
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800 border-green-200";
      case "blue":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "orange":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!coordinates) return null;

  const precision = getPrecisionLevel(accuracy);
  const Icon = precision.icon;

  return (
    <div className="space-y-2">
      <Badge
        variant="outline"
        className={`${getColorClasses(precision.color)} flex items-center gap-2 px-3 py-1`}
      >
        <Icon className="h-3 w-3" />
        {precision.text}
        {accuracy && (
          <span className="text-xs opacity-75">(±{accuracy.toFixed(1)}m)</span>
        )}
      </Badge>

      {precision.level === "excellent" && (
        <p className="text-xs text-green-600">
          🎯 Street-level accuracy achieved! Your location is precise to within
          5 meters.
        </p>
      )}

      {precision.level === "good" && (
        <p className="text-xs text-blue-600">
          ⚡ Building-level accuracy! Your location is precise to within 20
          meters.
        </p>
      )}

      {precision.level === "fair" && (
        <p className="text-xs text-yellow-600">
          📍 Neighborhood-level accuracy. Consider moving to an open area for
          better precision.
        </p>
      )}

      {precision.level === "poor" && (
        <p className="text-xs text-orange-600">
          🌍 General area detected. Try moving outdoors or enabling
          high-accuracy location.
        </p>
      )}
    </div>
  );
};

export default LocationPrecisionIndicator;
