import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressFormData {
  flatNo: string;
  landmark: string;
  areaDetails: string; // Combined village/town/city/pincode
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface CompactAddressFormProps {
  address: AddressFormData;
  onAddressChange: (address: AddressFormData) => void;
  className?: string;
  showDetectButton?: boolean;
}

const CompactAddressForm: React.FC<CompactAddressFormProps> = ({
  address,
  onAddressChange,
  className,
  showDetectButton = true,
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Save to localStorage whenever address changes
  useEffect(() => {
    try {
      localStorage.setItem("cleancare_address", JSON.stringify(address));
    } catch (error) {
      console.warn("Failed to save address to localStorage:", error);
    }
  }, [address]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cleancare_address");
      if (saved) {
        const savedAddress = JSON.parse(saved);
        onAddressChange({ ...address, ...savedAddress });
      }
    } catch (error) {
      console.warn("Failed to load address from localStorage:", error);
    }
  }, []);

  const handleFieldChange = (field: keyof AddressFormData, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    onAddressChange(updatedAddress);

    // Generate suggestions for area details
    if (field === "areaDetails" && value.length > 2) {
      generateSuggestions(value);
    } else {
      setShowSuggestions(false);
    }
  };

  const generateSuggestions = async (query: string) => {
    // Mock suggestions - in real app, use Google Places or similar API
    const mockSuggestions = [
      `${query}, Delhi, 110001`,
      `${query}, Mumbai, 400001`,
      `${query}, Bangalore, 560001`,
      `${query}, Hyderabad, 500001`,
      `${query}, Chennai, 600001`,
    ];

    setSuggestions(mockSuggestions.slice(0, 3));
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion: string) => {
    handleFieldChange("areaDetails", suggestion);
    setShowSuggestions(false);
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding using OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );

          if (response.ok) {
            const data = await response.json();

            // Parse address components
            const address_parts = data.address || {};
            const house_number = address_parts.house_number || "";
            const road = address_parts.road || "";
            const suburb =
              address_parts.suburb || address_parts.neighbourhood || "";
            const city =
              address_parts.city ||
              address_parts.town ||
              address_parts.village ||
              "";
            const postcode = address_parts.postcode || "";
            const state = address_parts.state || "";

            // Combine area details
            const areaDetails = [suburb, city, state, postcode]
              .filter(Boolean)
              .join(", ");

            const updatedAddress = {
              ...address,
              flatNo: house_number && road ? `${house_number}, ${road}` : road,
              areaDetails: areaDetails,
              coordinates: { lat: latitude, lng: longitude },
            };

            onAddressChange(updatedAddress);
          }
        } catch (error) {
          console.error("Error getting address details:", error);
          // Still save coordinates even if reverse geocoding fails
          onAddressChange({
            ...address,
            coordinates: { lat: latitude, lng: longitude },
          });
        }

        setIsDetecting(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetecting(false);

        let message = "Unable to detect location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += "Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message += "Location unavailable.";
            break;
          case error.TIMEOUT:
            message += "Request timed out.";
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      },
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Detect Location Button */}
        {showDetectButton && (
          <Button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-10 border-green-300 text-green-600 hover:bg-green-50"
          >
            {isDetecting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Detecting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Use Current Location
              </>
            )}
          </Button>
        )}

        {/* Address Fields */}
        <div className="space-y-3">
          {/* Flat/House Number and Street */}
          <div>
            <Label htmlFor="flatNo" className="text-sm font-medium">
              🏠 Flat/House No. & Street *
            </Label>
            <Input
              id="flatNo"
              placeholder="e.g., B-123, Sector 4, Main Road"
              value={address.flatNo}
              onChange={(e) => handleFieldChange("flatNo", e.target.value)}
              className="mt-1"
              required
            />
          </div>

          {/* Landmark */}
          <div>
            <Label htmlFor="landmark" className="text-sm font-medium">
              📍 Landmark (Optional)
            </Label>
            <Input
              id="landmark"
              placeholder="e.g., Near Metro Station, Opposite Mall"
              value={address.landmark}
              onChange={(e) => handleFieldChange("landmark", e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Combined Area Details */}
          <div className="relative">
            <Label htmlFor="areaDetails" className="text-sm font-medium">
              🌍 Village/Town/City, State & Pincode *
            </Label>
            <Input
              id="areaDetails"
              placeholder="e.g., Village Sector 18, Noida, Uttar Pradesh, 201301"
              value={address.areaDetails}
              onChange={(e) => handleFieldChange("areaDetails", e.target.value)}
              className="mt-1"
              required
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                  >
                    <MapPin className="inline h-3 w-3 mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Address Preview */}
        {(address.flatNo || address.areaDetails) && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Address Preview:</p>
                <p>
                  {[address.flatNo, address.landmark, address.areaDetails]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactAddressForm;
