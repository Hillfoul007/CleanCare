import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LocationDetectorProps {
  onLocationChange: (
    location: string,
    coordinates?: { lat: number; lng: number; accuracy?: number },
  ) => void;
  className?: string;
  showInTopBar?: boolean;
  defaultValue?: string;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number } | null) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const LocationDetector: React.FC<LocationDetectorProps> = ({
  onLocationChange,
  className = "",
  showInTopBar = false,
}) => {
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);

  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleMapsLoaded(true);
      }
    };
    checkGoogleMaps();
    const handleGoogleMapsLoaded = () => checkGoogleMaps();
    window.addEventListener("google-maps-loaded", handleGoogleMapsLoaded);
    return () =>
      window.removeEventListener("google-maps-loaded", handleGoogleMapsLoaded);
  }, []);

  useEffect(() => {
    if (
      googleMapsLoaded &&
      searchInputRef.current &&
      !autocompleteRef.current
    ) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ["geocode"],
          componentRestrictions: { country: ["in", "us", "ca", "gb", "au"] },
        },
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const location = place.formatted_address || place.name;
          const coordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setCurrentLocation(location);
          setSearchValue(location);
          onLocationChange(location, coordinates);
          setIsOpen(false);
        }
      });
    }
  }, [googleMapsLoaded, onLocationChange]);

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }

    setIsDetecting(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          if (googleMapsLoaded && window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };

            geocoder.geocode({ location: latlng }, (results, status) => {
              setIsDetecting(false);
              if (status === "OK" && results[0]) {
                let bestAddress = results[0].formatted_address;

                for (const result of results) {
                  if (
                    result.types.includes("street_address") ||
                    result.types.includes("premise") ||
                    result.types.includes("subpremise") ||
                    result.types.includes("route") ||
                    result.types.includes("point_of_interest")
                  ) {
                    bestAddress = result.formatted_address;
                    break;
                  }
                }

                setCurrentLocation(bestAddress);
                setSearchValue(bestAddress);
                onLocationChange(bestAddress, {
                  lat: latitude,
                  lng: longitude,
                  accuracy,
                });
              } else {
                const fallback = `Location ${latitude}, ${longitude}`;
                setCurrentLocation(fallback);
                setSearchValue(fallback);
                onLocationChange(fallback, { lat: latitude, lng: longitude, accuracy });
              }
            });
            return;
          }

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );

          if (response.ok) {
            const data = await response.json();
            let address = "";
            if (data.address) {
              const parts = [];
              if (data.address.road) parts.push(data.address.road);
              if (data.address.suburb || data.address.neighbourhood)
                parts.push(data.address.suburb || data.address.neighbourhood);
              if (data.address.city || data.address.town || data.address.village)
                parts.push(data.address.city || data.address.town || data.address.village);
              if (data.address.state) parts.push(data.address.state);
              address = parts.join(", ") || data.display_name;
            } else {
              address = data.display_name || `${latitude}, ${longitude}`;
            }

            setCurrentLocation(address);
            setSearchValue(address);
            onLocationChange(address, { lat: latitude, lng: longitude, accuracy });
            setIsDetecting(false);
            return;
          }

          const fallback = `Location ${latitude}, ${longitude}`;
          setCurrentLocation(fallback);
          setSearchValue(fallback);
          onLocationChange(fallback, { lat: latitude, lng: longitude, accuracy });
          setIsDetecting(false);
        } catch (err) {
          console.error(err);
          const fallback = "Your Current Location";
          setCurrentLocation(fallback);
          setSearchValue(fallback);
          onLocationChange(fallback, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "Unknown location error";
        }
        setError(errorMessage);
        setCurrentLocation(errorMessage);
        onLocationChange(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      },
    );
  };

  useEffect(() => {
    detectCurrentLocation();
  }, [googleMapsLoaded]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (googleMapsLoaded && window.google && value.length > 2) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: value,
          types: ["geocode"],
          componentRestrictions: { country: ["in", "us", "ca", "gb", "au"] },
        },
        (predictions, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        },
      );
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: any) => {
    setSearchValue(suggestion.description);
    setCurrentLocation(suggestion.description);
    onLocationChange(suggestion.description);
    setSuggestions([]);
    setIsOpen(false);

    if (googleMapsLoaded && window.google) {
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div"),
      );

      service.getDetails(
        { placeId: suggestion.place_id },
        (place: any, status: string) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place.geometry
          ) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            onLocationChange(suggestion.description, coordinates);
          }
        },
      );
    }
  };

  const renderLocationBox = (
    <>
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          placeholder="Search for a location..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      <Button
        onClick={detectCurrentLocation}
        disabled={isDetecting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {isDetecting ? "Detecting..." : "Use Current Location"}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => selectSuggestion(s)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{s.structured_formatting.main_text}</p>
                  <p className="text-xs text-gray-500">{s.structured_formatting.secondary_text}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {currentLocation && !isDetecting && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {currentLocation}
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </>
  );

  if (showInTopBar) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className={`flex items-center space-x-2 cursor-pointer ${className}`}>
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-white text-sm truncate max-w-32 md:max-w-48">
              {isDetecting ? "Detecting..." : currentLocation || "Select location"}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">{renderLocationBox}</PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border border-blue-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">📍 Select Location</h3>
      <div className="space-y-4">{renderLocationBox}</div>
    </div>
  );
};

export default LocationDetector;
