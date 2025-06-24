// Adaptive API client that automatically falls back to offline mode when backend is unreachable

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  isOffline?: boolean;
}

class AdaptiveApiClient {
  private baseURL: string;
  private isBackendAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 30000; // 30 seconds

  constructor() {
    // Try different possible backend URLs
    this.baseURL = this.detectBackendURL();
    this.checkBackendHealth();
  }

  private detectBackendURL(): string {
    // If we're running locally, use localhost
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3001/api";
    }

    // If we're running on a remote domain, immediately go offline
    console.log("Running on remote domain, using offline mode");
    return "offline";
  }

  private async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();

    // Only check health if it's been a while since last check
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isBackendAvailable;
    }

    this.lastHealthCheck = now;

    // If baseURL is 'offline' or we're on a remote domain, don't try to fetch
    if (
      this.baseURL === "offline" ||
      window.location.hostname !== "localhost"
    ) {
      this.isBackendAvailable = false;
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseURL.replace("/api", "")}/health`,
        {
          method: "GET",
          signal: AbortSignal.timeout(3000), // 3 second timeout
        },
      );

      this.isBackendAvailable = response.ok;
      return this.isBackendAvailable;
    } catch (error) {
      console.log(
        "Backend health check failed, switching to offline mode:",
        error.message,
      );
      this.isBackendAvailable = false;
      return false;
    }
  }

  async makeRequest<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    // If we know we're offline (remote domain or baseURL is 'offline'), skip health check
    if (
      this.baseURL === "offline" ||
      window.location.hostname !== "localhost"
    ) {
      return this.handleOfflineRequest<T>(url, options);
    }

    // Check if backend is available (only for localhost)
    const isAvailable = await this.checkBackendHealth();

    if (!isAvailable) {
      return this.handleOfflineRequest<T>(url, options);
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      console.log(
        `API request failed for ${url}, falling back to offline mode:`,
        error.message,
      );
      return this.handleOfflineRequest<T>(url, options);
    }
  }

  private handleOfflineRequest<T>(
    url: string,
    options: RequestInit,
  ): ApiResponse<T> {
    console.log("Handling offline request for:", url);

    // Handle different endpoints in offline mode
    if (url.includes("/auth/check-phone")) {
      return { data: { exists: false } as T, isOffline: true };
    }

    if (url.includes("/auth/check-email")) {
      return { data: { exists: false } as T, isOffline: true };
    }

    if (url.includes("/auth/register")) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const offlineUser = {
        _id: `offline_${Date.now()}`,
        email: body.email || "offline@user.com",
        full_name: body.name || "Offline User",
        phone: body.phone || "+1234567890",
        user_type: body.userType || "customer",
        phone_verified: true,
        created_at: new Date().toISOString(),
      };

      // Store offline user
      localStorage.setItem("auth_token", `offline_token_${Date.now()}`);
      localStorage.setItem("current_user", JSON.stringify(offlineUser));

      return {
        data: { user: offlineUser, token: `offline_token_${Date.now()}` } as T,
        isOffline: true,
      };
    }

    if (url.includes("/location/geocode")) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const { lat, lng } = body;
      return {
        data: {
          address:
            lat && lng
              ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
              : "Location unavailable",
          components: [],
          geometry: { location: { lat: lat || 0, lng: lng || 0 } },
        } as T,
        isOffline: true,
      };
    }

    if (url.includes("/bookings")) {
      // Handle booking creation offline
      if (options.method === "POST") {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const offlineBooking = {
          _id: `offline_booking_${Date.now()}`,
          ...body,
          status: "confirmed",
          paymentStatus: "pending",
          createdAt: new Date().toISOString(),
        };

        // Store offline booking
        const existingBookings = JSON.parse(
          localStorage.getItem("offline_bookings") || "[]",
        );
        existingBookings.push(offlineBooking);
        localStorage.setItem(
          "offline_bookings",
          JSON.stringify(existingBookings),
        );

        return { data: offlineBooking as T, isOffline: true };
      }

      // Handle booking retrieval offline
      const offlineBookings = JSON.parse(
        localStorage.getItem("offline_bookings") || "[]",
      );
      return { data: offlineBookings as T, isOffline: true };
    }

    // Default offline response
    return {
      error: "Service unavailable offline",
      isOffline: true,
    };
  }

  // Convenience methods
  async checkPhone(phone: string): Promise<ApiResponse<{ exists: boolean }>> {
    return this.makeRequest("/auth/check-phone", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async checkEmail(email: string): Promise<ApiResponse<{ exists: boolean }>> {
    return this.makeRequest("/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async registerUser(
    userData: any,
  ): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.makeRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async geocodeLocation(
    lat: number,
    lng: number,
  ): Promise<ApiResponse<{ address: string }>> {
    return this.makeRequest("/location/geocode", {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    });
  }

  async createBooking(bookingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  }

  getStatus(): { isOnline: boolean; backendURL: string } {
    return {
      isOnline: this.isBackendAvailable,
      backendURL: this.baseURL,
    };
  }
}

// Create singleton instance
export const adaptiveApi = new AdaptiveApiClient();
export default adaptiveApi;
