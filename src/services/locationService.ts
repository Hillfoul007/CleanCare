// Simplified location service without Supabase dependencies
// This is a stub implementation for demo purposes

import { apiClient } from "@/lib/api";

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface LocationData {
  id: string;
  address: string;
  coordinates: Coordinates;
  name?: string;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceAutocomplete {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formatted_address: string;
  place_id?: string;
}

class LocationService {
  private readonly GOOGLE_MAPS_API_KEY = import.meta.env
    .VITE_GOOGLE_MAPS_API_KEY;

  /**
   * Get user's current position using browser geolocation
   */
  async getCurrentPosition(options?: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
          ...options,
        },
      );
    });
  }

  /**
   * Reverse geocode coordinates to human-readable address with maximum detail
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    console.log("🔍 Starting detailed reverse geocoding for:", coordinates);

    // Try multiple geocoding services for maximum accuracy and detail

    // Method 1: Google Maps API with detailed results (if available)
    if (this.GOOGLE_MAPS_API_KEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&result_type=street_address|premise|subpremise&key=${this.GOOGLE_MAPS_API_KEY}`,
        );

        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          console.log("✅ Google Maps detailed result:", data.results[0]);
          return data.results[0].formatted_address;
        }
      } catch (error) {
        console.warn("Google Maps reverse geocoding failed:", error);
      }
    }

    // Method 2: Nominatim with maximum detail zoom level
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=20&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            "User-Agent": "LaundaryFlash-App/1.0",
          },
        },
      );

      const data = await response.json();

      if (data && data.display_name) {
        console.log("✅ Nominatim detailed result:", data);
        return data.display_name;
      }
    } catch (error) {
      console.warn("Nominatim reverse geocoding failed:", error);
    }

    // Method 3: Try alternative coordinates API
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coordinates.lat}&longitude=${coordinates.lng}&localityLanguage=en`,
      );

      const data = await response.json();

      if (data && data.locality) {
        const address = [
          data.locality,
          data.principalSubdivision,
          data.countryName,
        ]
          .filter(Boolean)
          .join(", ");
        console.log("✅ BigDataCloud result:", address);
        return address;
      }
    } catch (error) {
      console.warn("BigDataCloud reverse geocoding failed:", error);
    }

    // Method 4: Create a formatted address from coordinates using detailed location patterns
    const formattedCoords = await this.formatCoordinatesAsAddress(coordinates);
    return formattedCoords;
  }

  /**
   * Get detailed address components from coordinates
   */
  async getDetailedAddressComponents(coordinates: Coordinates): Promise<any> {
    console.log("🔍 Getting detailed address components...");

    if (this.GOOGLE_MAPS_API_KEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${this.GOOGLE_MAPS_API_KEY}`,
        );

        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          console.log("✅ Detailed components from Google:", data.results[0]);
          return data.results[0];
        }
      } catch (error) {
        console.warn("Google Maps component extraction failed:", error);
      }
    }

    // Fallback to Nominatim for detailed components
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=20&addressdetails=1`,
        {
          headers: {
            "User-Agent": "LaundaryFlash-App/1.0",
          },
        },
      );

      const data = await response.json();

      if (data && data.address) {
        console.log("✅ Detailed components from Nominatim:", data);
        // Convert Nominatim format to Google-like format
        return {
          formatted_address: data.display_name,
          address_components: this.convertNominatimToGoogleFormat(data.address),
          geometry: {
            location: {
              lat: () => parseFloat(data.lat),
              lng: () => parseFloat(data.lon),
            },
          },
        };
      }
    } catch (error) {
      console.warn("Nominatim component extraction failed:", error);
    }

    return null;
  }

  /**
   * Convert Nominatim address format to Google Maps format
   */
  private convertNominatimToGoogleFormat(nominatimAddress: any): any[] {
    const components = [];

    if (nominatimAddress.house_number) {
      components.push({
        long_name: nominatimAddress.house_number,
        short_name: nominatimAddress.house_number,
        types: ["street_number"],
      });
    }

    if (nominatimAddress.road) {
      components.push({
        long_name: nominatimAddress.road,
        short_name: nominatimAddress.road,
        types: ["route"],
      });
    }

    if (nominatimAddress.neighbourhood || nominatimAddress.suburb) {
      components.push({
        long_name: nominatimAddress.neighbourhood || nominatimAddress.suburb,
        short_name: nominatimAddress.neighbourhood || nominatimAddress.suburb,
        types: ["sublocality_level_1", "sublocality"],
      });
    }

    if (
      nominatimAddress.city ||
      nominatimAddress.town ||
      nominatimAddress.village
    ) {
      components.push({
        long_name:
          nominatimAddress.city ||
          nominatimAddress.town ||
          nominatimAddress.village,
        short_name:
          nominatimAddress.city ||
          nominatimAddress.town ||
          nominatimAddress.village,
        types: ["locality"],
      });
    }

    if (nominatimAddress.state) {
      components.push({
        long_name: nominatimAddress.state,
        short_name: nominatimAddress.state,
        types: ["administrative_area_level_1"],
      });
    }

    if (nominatimAddress.postcode) {
      components.push({
        long_name: nominatimAddress.postcode,
        short_name: nominatimAddress.postcode,
        types: ["postal_code"],
      });
    }

    if (nominatimAddress.country) {
      components.push({
        long_name: nominatimAddress.country,
        short_name:
          nominatimAddress.country_code?.toUpperCase() ||
          nominatimAddress.country,
        types: ["country"],
      });
    }

    return components;
  }

  /**
   * Format coordinates as a readable address using geographical context
   */
  private async formatCoordinatesAsAddress(
    coordinates: Coordinates,
  ): Promise<string> {
    // Check if coordinates are in known regions (India focus)
    const { lat, lng } = coordinates;

    // India bounding box check
    if (lat >= 6.0 && lat <= 37.6 && lng >= 68.7 && lng <= 97.25) {
      // Rough region detection for India
      let region = "India";

      if (lat >= 28.4 && lat <= 28.8 && lng >= 76.8 && lng <= 77.3) {
        region = "Gurgaon, Haryana, India";
      } else if (lat >= 28.5 && lat <= 28.7 && lng >= 77.1 && lng <= 77.3) {
        region = "New Delhi, India";
      } else if (lat >= 19.0 && lat <= 19.3 && lng >= 72.7 && lng <= 73.0) {
        region = "Mumbai, Maharashtra, India";
      } else if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
        region = "Bangalore, Karnataka, India";
      } else if (lat >= 17.3 && lat <= 17.5 && lng >= 78.3 && lng <= 78.6) {
        region = "Hyderabad, Telangana, India";
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}, ${region}`;
    }

    // Default coordinates display
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_MAPS_API_KEY}`,
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        return {
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
          formatted_address: result.formatted_address,
          place_id: result.place_id,
        };
      }

      throw new Error(`Geocoding failed: ${data.status}`);
    } catch (error) {
      throw new Error(
        `Geocoding error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get place autocomplete suggestions
   */
  async getPlaceAutocomplete(
    input: string,
    location?: Coordinates,
    radius?: number,
  ): Promise<PlaceAutocomplete[]> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      return [];
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.GOOGLE_MAPS_API_KEY}`;

      if (location) {
        url += `&location=${location.lat},${location.lng}`;
        if (radius) {
          url += `&radius=${radius}`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.predictions || [];
      }

      return [];
    } catch (error) {
      console.warn("Place autocomplete failed:", error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) *
        Math.cos(this.deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Mock methods for database operations (previously Supabase)
   */
  async saveLocationToDatabase(
    locationData: LocationData,
  ): Promise<LocationData> {
    // Mock implementation - save to localStorage
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    existingLocations.push(locationData);
    localStorage.setItem("saved_locations", JSON.stringify(existingLocations));
    return locationData;
  }

  async getSavedLocations(): Promise<LocationData[]> {
    // Mock implementation - load from localStorage
    return JSON.parse(localStorage.getItem("saved_locations") || "[]");
  }

  async updateLocationInDatabase(
    locationId: string,
    updates: Partial<LocationData>,
  ): Promise<LocationData> {
    // Mock implementation
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    const updatedLocations = existingLocations.map((loc: LocationData) =>
      loc.id === locationId
        ? { ...loc, ...updates, updatedAt: new Date() }
        : loc,
    );
    localStorage.setItem("saved_locations", JSON.stringify(updatedLocations));
    return updatedLocations.find((loc: LocationData) => loc.id === locationId);
  }

  async deleteLocationFromDatabase(locationId: string): Promise<void> {
    // Mock implementation
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    const filteredLocations = existingLocations.filter(
      (loc: LocationData) => loc.id !== locationId,
    );
    localStorage.setItem("saved_locations", JSON.stringify(filteredLocations));
  }
}

export const locationService = new LocationService();
