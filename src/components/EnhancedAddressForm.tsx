import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, Navigation, X } from "lucide-react";
import { locationService, Coordinates } from "@/services/locationService";

interface AddressData {
  flatNo: string;
  flatHouseNo?: string;
  street: string;
  landmark: string;
  village: string;
  city: string;
  pincode: string;
  fullAddress: string;
  coordinates?: Coordinates;
  label?: string;
  type?: string;
}

interface EnhancedAddressFormProps {
  onAddressChange?: (address: AddressData) => void;
  onAddressUpdate?: (address: AddressData) => void;
  initialAddress?: AddressData;
  initialData?: any;
  className?: string;
  showLabel?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const EnhancedAddressForm: React.FC<EnhancedAddressFormProps> = ({
  onAddressChange,
  onAddressUpdate,
  initialAddress,
  initialData,
  className = "",
  showLabel = false,
}) => {
  const [address, setAddress] = useState<AddressData>({
    flatNo: initialData?.flatHouseNo || initialAddress?.flatNo || "",
    flatHouseNo: initialData?.flatHouseNo || initialAddress?.flatHouseNo || "",
    street: initialData?.street || initialAddress?.street || "",
    landmark: initialData?.landmark || initialAddress?.landmark || "",
    village: initialData?.village || initialAddress?.village || "",
    city: initialData?.city || initialAddress?.city || "",
    pincode: initialData?.pincode || initialAddress?.pincode || "",
    fullAddress: initialAddress?.fullAddress || "",
    label: initialData?.label || "",
    type: initialData?.type || "other",
    ...initialAddress,
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLoadingGoogleMaps, setIsLoadingGoogleMaps] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      initializeAutocomplete();
    } else {
      loadGoogleMapsAPI();
    }
  }, []);

  // Auto-detect location on mount if no initial address provided
  useEffect(() => {
    if (!initialAddress?.fullAddress && !address.fullAddress) {
      detectCurrentLocation();
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadGoogleMapsAPI = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API key not configured");
      return;
    }

    // Check if script is already loading/loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log("Google Maps script already exists");
      return;
    }

    setIsLoadingGoogleMaps(true);
    const script = document.createElement("script");
    const callbackName = `initGoogleMaps_${Date.now()}`;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    (window as any)[callbackName] = () => {
      setIsLoadingGoogleMaps(false);
      initializeAutocomplete();
      delete (window as any)[callbackName];
    };

    document.head.appendChild(script);
  };

  const initializeAutocomplete = () => {
    if (!window.google || !searchInputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "IN" },
        fields: ["address_components", "formatted_address", "geometry"],
      },
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place.address_components) {
        parseGoogleMapsPlace(place);
      }
    });
  };

  const parseGoogleMapsPlace = (place: any) => {
    const components = place.address_components;
    const newAddress: AddressData = {
      flatNo: address.flatNo, // Keep user-entered flat number
      street: "",
      landmark: address.landmark, // Keep user-entered landmark
      village: "",
      city: "",
      pincode: "",
      fullAddress: place.formatted_address || "",
      coordinates: place.geometry?.location
        ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
        : undefined,
    };

    // Parse address components to extract detailed information
    components.forEach((component: any) => {
      const types = component.types;
      const longName = component.long_name;
      const shortName = component.short_name;

      if (types.includes("street_number")) {
        // House/building number
        if (!newAddress.flatNo) {
          newAddress.flatNo = longName;
        }
      } else if (types.includes("route")) {
        // Street name
        newAddress.street = longName;
      } else if (types.includes("sublocality_level_2")) {
        // Sector/Area
        if (!newAddress.street) {
          newAddress.street = longName;
        } else {
          newAddress.street += `, ${longName}`;
        }
      } else if (
        types.includes("sublocality_level_1") ||
        types.includes("sublocality")
      ) {
        // Locality/Neighborhood
        newAddress.village = longName;
      } else if (types.includes("locality")) {
        // City
        newAddress.city = longName;
      } else if (types.includes("administrative_area_level_2")) {
        // District - use as city if city not found
        if (!newAddress.city) {
          newAddress.city = longName;
        }
      } else if (types.includes("administrative_area_level_1")) {
        // State - use as city if neither city nor district found
        if (!newAddress.city && !newAddress.village) {
          newAddress.city = longName;
        }
      } else if (types.includes("postal_code")) {
        // Pincode
        newAddress.pincode = longName;
      } else if (types.includes("premise") || types.includes("establishment")) {
        // Landmark/Building name
        if (!newAddress.landmark) {
          newAddress.landmark = longName;
        }
      }
    });

    // Fallback: if village is empty, use part of city or street
    if (!newAddress.village && newAddress.city) {
      newAddress.village = newAddress.city;
    }

    // If street is empty, try to extract from formatted address
    if (!newAddress.street && place.formatted_address) {
      const addressParts = place.formatted_address.split(",");
      if (addressParts.length > 1) {
        newAddress.street = addressParts[1].trim();
      }
    }

    setAddress(newAddress);
    setSearchValue(place.formatted_address || "");
    setShowSuggestions(false);
    onAddressChange(newAddress);
  };

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      let coordinates: Coordinates;

      try {
        // Get user's current location with highest accuracy settings
        coordinates = await locationService.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0, // Don't use cached location
        });
        console.log("📍 Location detected:", coordinates);
      } catch (locationError) {
        // Fallback to default coordinates (28.5600, 76.9989)
        console.log("Using fallback coordinates");
        coordinates = { lat: 28.56, lng: 76.9989 };
      }

      // Get address details and fill the form
      await parseLocationData(coordinates);
    } catch (error) {
      console.error("Error detecting location:", error);
      // Final fallback with default coordinates
      const fallbackCoords = { lat: 28.56, lng: 76.9989 };
      await parseLocationData(fallbackCoords);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const parseLocationData = async (coordinates: Coordinates) => {
    try {
      // Try Google Maps first if available
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: coordinates.lat, lng: coordinates.lng } },
          (results: any[], status: string) => {
            if (status === "OK" && results[0]) {
              parseGoogleMapsPlace(results[0]);
              return;
            } else {
              // Fallback to alternative methods
              tryAlternativeGeocoding(coordinates);
            }
          },
        );
      } else {
        // No Google Maps, try alternative methods
        await tryAlternativeGeocoding(coordinates);
      }
    } catch (error) {
      console.error("Error parsing location data:", error);
      await tryAlternativeGeocoding(coordinates);
    }
  };

  const tryAlternativeGeocoding = async (coordinates: Coordinates) => {
    try {
      // Try our location service
      const addressString = await locationService.reverseGeocode(coordinates);

      if (
        addressString &&
        addressString !==
          `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
      ) {
        // Parse the address string to extract components
        const parsedAddress = parseAddressString(addressString, coordinates);
        setAddress(parsedAddress);
        setSearchValue(addressString);
        onAddressChange(parsedAddress);
      } else {
        // Use coordinates as address
        const coordsAddress = createCoordinatesAddress(coordinates);
        setAddress(coordsAddress);
        setSearchValue(coordsAddress.fullAddress);
        onAddressChange(coordsAddress);
      }
    } catch (error) {
      console.error("Alternative geocoding failed:", error);
      // Final fallback
      const coordsAddress = createCoordinatesAddress(coordinates);
      setAddress(coordsAddress);
      setSearchValue(coordsAddress.fullAddress);
      onAddressChange(coordsAddress);
    }
  };

  const parseAddressString = (
    addressString: string,
    coordinates: Coordinates,
  ): AddressData => {
    const parts = addressString.split(",").map((part) => part.trim());

    return {
      flatNo: address.flatNo || "", // Keep user input
      street: parts[1] || "",
      landmark: address.landmark || "", // Keep user input
      village: parts[2] || parts[1] || "",
      city: parts[parts.length - 3] || parts[parts.length - 2] || "",
      pincode: extractPincode(addressString) || "",
      fullAddress: addressString,
      coordinates,
    };
  };

  const createCoordinatesAddress = (coordinates: Coordinates): AddressData => {
    return {
      flatNo: address.flatNo || "",
      street: address.street || "",
      landmark: address.landmark || "",
      village: address.village || "",
      city: address.city || "",
      pincode: address.pincode || "",
      fullAddress: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
      coordinates,
    };
  };

  const extractPincode = (text: string): string => {
    const pincodeMatch = text.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : "";
  };

  const handleFieldChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...address, [field]: value };

    // Update full address when individual fields change
    if (field !== "fullAddress" && field !== "coordinates") {
      const parts = [
        newAddress.flatNo,
        newAddress.street,
        newAddress.landmark,
        newAddress.village,
        newAddress.city,
        newAddress.pincode,
      ].filter(Boolean);
      newAddress.fullAddress = parts.join(", ");
    }

    setAddress(newAddress);
    if (onAddressChange) {
      onAddressChange(newAddress);
    }
    if (onAddressUpdate) {
      onAddressUpdate(newAddress);
    }
  };

  const resetForm = () => {
    const emptyAddress: AddressData = {
      flatNo: "",
      street: "",
      landmark: "",
      village: "",
      city: "",
      pincode: "",
      fullAddress: "",
      coordinates: undefined,
    };
    setAddress(emptyAddress);
    setSearchValue("");
    onAddressChange(emptyAddress);
  };

  // Search for places when user types
  useEffect(() => {
    const searchPlaces = async () => {
      if (searchValue.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        // Try Google Places API first
        if (window.google && window.google.maps && window.google.maps.places) {
          const service = new window.google.maps.places.AutocompleteService();
          service.getPlacePredictions(
            {
              input: searchValue,
              componentRestrictions: { country: "in" },
              types: ["address", "establishment", "geocode"],
            },
            (predictions, status) => {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK &&
                predictions
              ) {
                setSuggestions(predictions.slice(0, 5));
                setShowSuggestions(true);
              } else {
                // Fallback to alternative search
                searchAlternativePlaces(searchValue);
              }
              setIsSearching(false);
            },
          );
        } else {
          // Use alternative search method
          await searchAlternativePlaces(searchValue);
        }
      } catch (error) {
        console.error("Search error:", error);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchPlaces, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  // Alternative place search using Nominatim
  const searchAlternativePlaces = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, India&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "LaundaryFlash-App/1.0",
          },
        },
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const formattedSuggestions = data.map((place: any) => ({
          description: place.display_name,
          place_id: place.place_id,
          structured_formatting: {
            main_text: place.name || place.display_name.split(",")[0],
            secondary_text: place.display_name.split(",").slice(1).join(","),
          },
          geometry: {
            location: {
              lat: () => parseFloat(place.lat),
              lng: () => parseFloat(place.lon),
            },
          },
        }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Alternative search failed:", error);
    }
    setIsSearching(false);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: any) => {
    setSearchValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      if (
        suggestion.place_id &&
        window.google &&
        window.google.maps &&
        window.google.maps.places
      ) {
        // Get detailed place information from Google
        const service = new window.google.maps.places.PlacesService(
          document.createElement("div"),
        );
        service.getDetails(
          { placeId: suggestion.place_id },
          (place, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place
            ) {
              parseGoogleMapsPlace(place);
            }
          },
        );
      } else if (suggestion.geometry) {
        // Use coordinates to get address details
        const coordinates = {
          lat: suggestion.geometry.location.lat(),
          lng: suggestion.geometry.location.lng(),
        };
        await parseLocationData(coordinates);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  // Update address whenever individual fields change
  useEffect(() => {
    onAddressChange(address);
  }, [address]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            Delivery Address
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetForm}
            className="text-gray-500 hover:text-gray-700"
            title="Clear all fields"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Search */}
        <div className="space-y-3">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={searchInputRef}
                  placeholder="Type to search places (e.g., MG Road Gurgaon, Sector 15 Delhi)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.structured_formatting?.main_text ||
                        suggestion.description?.split(",")[0]}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {suggestion.structured_formatting?.secondary_text ||
                        suggestion.description
                          ?.split(",")
                          .slice(1)
                          .join(",")
                          .trim()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-detect button */}
          <Button
            type="button"
            variant="default"
            onClick={detectCurrentLocation}
            disabled={isDetectingLocation}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Detecting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Use My Current Location
              </>
            )}
          </Button>
        </div>

        {(isLoadingGoogleMaps || isDetectingLocation) && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">
              {isDetectingLocation
                ? "Detecting your location and filling address details..."
                : "Loading address suggestions..."}
            </span>
          </div>
        )}

        {/* Label and Type Fields (if enabled) */}
        {showLabel && (
          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="label" className="text-sm font-medium">
                  🏷️ Address Label *
                </Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Office, Parent's House"
                  value={address.label}
                  onChange={(e) => handleFieldChange("label", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-sm font-medium">
                  📂 Address Type
                </Label>
                <select
                  id="type"
                  value={address.type}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="home">🏠 Home</option>
                  <option value="work">🏢 Work</option>
                  <option value="other">📍 Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Individual Address Fields */}
        <div className="space-y-4">
          {/* Row 1: House/Flat and Street */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flatNo" className="text-sm font-medium">
                🏠 Flat/House No. *
              </Label>
              <Input
                id="flatNo"
                placeholder="e.g., A-101, House No. 45"
                value={address.flatNo}
                onChange={(e) => handleFieldChange("flatNo", e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="street" className="text-sm font-medium">
                🛣️ Street/Area
              </Label>
              <Input
                id="street"
                placeholder="e.g., MG Road, Sector 15"
                value={address.street}
                onChange={(e) => handleFieldChange("street", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Row 2: Landmark and Village/Town */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="landmark" className="text-sm font-medium">
                📍 Landmark
              </Label>
              <Input
                id="landmark"
                placeholder="e.g., Near Metro Station, Opposite Mall"
                value={address.landmark}
                onChange={(e) => handleFieldChange("landmark", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="village" className="text-sm font-medium">
                🏘️ Village/Town *
              </Label>
              <Input
                id="village"
                placeholder="e.g., Gurgaon, DLF Phase 1"
                value={address.village}
                onChange={(e) => handleFieldChange("village", e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Row 3: City and Pincode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium">
                🏙️ City *
              </Label>
              <Input
                id="city"
                placeholder="e.g., Gurgaon, Delhi, Mumbai"
                value={address.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="pincode" className="text-sm font-medium">
                📮 Pincode *
              </Label>
              <Input
                id="pincode"
                placeholder="e.g., 122018"
                value={address.pincode}
                onChange={(e) => handleFieldChange("pincode", e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                className="mt-1"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Status */}
        {address.coordinates && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <Label className="text-sm font-medium text-green-700">
                📍 Location detected and address filled automatically
              </Label>
            </div>
            {address.coordinates.accuracy &&
              address.coordinates.accuracy <= 20 && (
                <p className="text-xs text-green-600 mt-1">
                  🎯 High accuracy location detected
                </p>
              )}
          </div>
        )}

        {/* Full Address Preview */}
        {address.fullAddress && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Complete Address:
            </Label>
            <p className="text-sm text-gray-800">{address.fullAddress}</p>
          </div>
        )}

        {/* Submit Button for SavedAddressesModal */}
        {onAddressUpdate && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => onAddressUpdate(address)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={
                !address.flatNo ||
                !address.village ||
                !address.city ||
                !address.pincode ||
                (showLabel && !address.label)
              }
            >
              Save Address
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedAddressForm;
