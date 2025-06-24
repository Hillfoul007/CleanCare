// Simplified provider location service without Supabase dependencies
// This is a stub implementation for demo purposes

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  rider_id?: string;
  service: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  coordinates?: Coordinates;
}

export interface Rider {
  id: string;
  user_id: string;
  is_online: boolean;
  current_location?: string;
  coordinates?: Coordinates;
}

export interface Provider {
  id: string;
  user_id: string;
  services: string[];
  hourly_rate: number;
  coordinates?: Coordinates;
}

class ProviderLocationService {
  /**
   * Find nearby providers within a radius
   */
  async findNearbyProviders(
    userCoordinates: Coordinates,
    radiusKm: number = 10,
    serviceType?: string,
  ): Promise<Provider[]> {
    // Mock implementation - returns empty array
    console.log("Mock: Finding nearby providers", {
      userCoordinates,
      radiusKm,
      serviceType,
    });
    return [];
  }

  /**
   * Find nearby riders for delivery
   */
  async findNearbyRiders(
    pickupCoordinates: Coordinates,
    radiusKm: number = 5,
  ): Promise<Rider[]> {
    // Mock implementation - returns empty array
    console.log("Mock: Finding nearby riders", { pickupCoordinates, radiusKm });
    return [];
  }

  /**
   * Update rider location
   */
  async updateRiderLocation(
    riderId: string,
    coordinates: Coordinates,
    address?: string,
  ): Promise<boolean> {
    // Mock implementation - always returns true
    console.log("Mock: Updating rider location", {
      riderId,
      coordinates,
      address,
    });
    return true;
  }

  /**
   * Create delivery request
   */
  async createDeliveryRequest(
    requestData: any,
  ): Promise<{ id: string } | null> {
    // Mock implementation
    console.log("Mock: Creating delivery request", requestData);
    return { id: `delivery_${Date.now()}` };
  }

  /**
   * Calculate distance between two coordinates
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
    const distance = R * c; // Distance in kilometers

    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const providerLocationService = new ProviderLocationService();
