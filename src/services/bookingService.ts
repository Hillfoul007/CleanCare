import MongoDBService from "./mongodbService";

export interface BookingDetails {
  id: string;
  userId: string;
  services: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  pickupDate: string;
  deliveryDate: string;
  pickupTime: string;
  deliveryTime: string;
  address: {
    fullAddress: string;
    flatNo?: string;
    street?: string;
    landmark?: string;
    village?: string;
    city?: string;
    pincode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contactDetails: {
    phone: string;
    name: string;
    instructions?: string;
  };
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  error?: string;
  booking?: BookingDetails;
  bookings?: BookingDetails[];
}

export class BookingService {
  private static instance: BookingService;
  private apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
  private mongoService: MongoDBService;

  constructor() {
    this.mongoService = MongoDBService.getInstance();
  }

  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Create a new booking
   */
  async createBooking(
    bookingData: Omit<BookingDetails, "id" | "createdAt" | "updatedAt">,
  ): Promise<BookingResponse> {
    try {
      console.log("📝 Creating new booking:", bookingData);

      // Generate booking ID
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const booking: BookingDetails = {
        ...bookingData,
        id: bookingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Always save to localStorage first for immediate availability
      this.saveBookingToLocalStorage(booking);

      // Save to MongoDB
      try {
        const mongoBooking = await this.mongoService.saveBooking(booking);
        if (mongoBooking) {
          console.log("✅ Booking saved to MongoDB:", booking.id);
        } else {
          console.log("⚠️ MongoDB save failed, using localStorage");
        }
      } catch (error) {
        console.warn("⚠️ MongoDB save error:", error);
      }

      console.log("💾 Booking saved to localStorage:", booking.id);

      // Note: Backend sync disabled to prevent fetch errors
      // When backend becomes available, uncomment the sync logic below
      /*
      // Try to sync with backend (but don't block on it)
      if (navigator.onLine) {
        // Attempt backend sync in background (don't await)
        this.syncBookingToBackend(booking).catch(error => {
          console.warn("Background sync failed:", error);
        });
      }
      */

      return {
        success: true,
        message: "Booking created successfully",
        booking,
      };
    } catch (error) {
      console.error("❌ Failed to create booking:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create booking",
      };
    }
  }

  /**
   * Get user bookings
   */
  async getUserBookings(userId: string): Promise<BookingResponse> {
    console.log("📋 Loading bookings for user:", userId);

    // Try MongoDB first
    try {
      const mongoBookings = await this.mongoService.getUserBookings(userId);
      if (mongoBookings && mongoBookings.length > 0) {
        console.log("✅ Bookings loaded from MongoDB:", mongoBookings.length);
        // Map mongoBookings to include paymentStatus
        const mappedBookings = mongoBookings.map((booking) => ({
          ...booking,
          paymentStatus: booking.payment_status || "pending",
        }));
        return {
          success: true,
          bookings: mappedBookings,
        };
      }
    } catch (error) {
      console.warn("⚠️ MongoDB fetch failed:", error);
    }

    // Fallback to localStorage
    const localBookings = this.getBookingsFromLocalStorage(userId);
    console.log("📱 Using localStorage fallback:", localBookings.length);
    return {
      success: true,
      bookings: localBookings,
    };

    // Note: Backend sync disabled to prevent fetch errors
    // When backend becomes available, uncomment the sync logic below
    /*
    // Try to sync with backend in background (non-blocking)
    this.syncWithBackendInBackground(userId, localBookings);
    */
  }

  /**
   * Background sync with backend (non-blocking)
   */
  private async syncWithBackendInBackground(
    userId: string,
    localBookings: BookingDetails[],
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Short timeout for background sync

      const response = await fetch(
        `${this.apiBaseUrl}/bookings/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("cleancare_auth_token")}`,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Background sync successful:", result);

        // Update localStorage with merged data
        const backendBookings = result.bookings || [];
        const mergedBookings = this.mergeBookings(
          localBookings,
          backendBookings,
        );

        // Save merged data back to localStorage
        mergedBookings.forEach((booking) => {
          this.saveBookingToLocalStorage(booking);
        });
      }
    } catch (error) {
      console.log("ℹ️ Background sync skipped (backend unavailable)");
    }
  }

  /**
   * Merge local and backend bookings, prioritizing local for newer items
   */
  private mergeBookings(
    localBookings: BookingDetails[],
    backendBookings: BookingDetails[],
  ): BookingDetails[] {
    const localIds = new Set(localBookings.map((b) => b.id));
    const uniqueBackendBookings = backendBookings.filter(
      (b) => !localIds.has(b.id),
    );

    // Combine and sort by creation date (newest first)
    return [...localBookings, ...uniqueBackendBookings].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Sync booking to backend in background
   */
  private async syncBookingToBackend(booking: BookingDetails): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.apiBaseUrl}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cleancare_auth_token")}`,
        },
        body: JSON.stringify(booking),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("✅ Booking synced to backend:", booking.id);
      } else {
        throw new Error(`Backend sync failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn("⚠️ Backend sync failed:", error);
      // Could implement retry logic here if needed
    }
  }

  /**
   * Update booking
   */
  async updateBooking(
    bookingId: string,
    updates: Partial<BookingDetails>,
  ): Promise<BookingResponse> {
    try {
      console.log("✏️ Updating booking:", bookingId, updates);

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update in localStorage first (reliable mode)
      const updatedBooking = this.updateBookingInLocalStorage(
        bookingId,
        updatedData,
      );

      if (updatedBooking) {
        console.log("💾 Booking updated in localStorage:", bookingId);
        return {
          success: true,
          message: "Booking updated successfully",
          booking: updatedBooking,
        };
      } else {
        throw new Error("Booking not found");
      }

      // Note: Backend sync disabled to prevent fetch errors
      // When backend becomes available, uncomment the sync logic below
      /*
      // Try to sync update with backend in background
      this.syncBookingUpdateToBackend(bookingId, updatedData).catch(error => {
        console.warn("Background sync failed:", error);
      });
      */
    } catch (error) {
      console.error("❌ Failed to update booking:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update booking",
      };
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string): Promise<BookingResponse> {
    return this.updateBooking(bookingId, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Save booking to localStorage
   */
  private saveBookingToLocalStorage(booking: BookingDetails): void {
    try {
      const existingBookings = JSON.parse(
        localStorage.getItem("user_bookings") || "[]",
      );
      existingBookings.push(booking);
      localStorage.setItem("user_bookings", JSON.stringify(existingBookings));
      console.log("💾 Booking saved to localStorage");
    } catch (error) {
      console.error("Failed to save booking to localStorage:", error);
    }
  }

  /**
   * Get bookings from localStorage
   */
  private getBookingsFromLocalStorage(userId: string): BookingDetails[] {
    try {
      const allBookings = JSON.parse(
        localStorage.getItem("user_bookings") || "[]",
      );
      return allBookings.filter(
        (booking: BookingDetails) => booking.userId === userId,
      );
    } catch (error) {
      console.error("Failed to load bookings from localStorage:", error);
      return [];
    }
  }

  /**
   * Update booking in localStorage
   */
  private updateBookingInLocalStorage(
    bookingId: string,
    updates: Partial<BookingDetails>,
  ): BookingDetails | null {
    try {
      const allBookings = JSON.parse(
        localStorage.getItem("user_bookings") || "[]",
      );
      const bookingIndex = allBookings.findIndex(
        (booking: BookingDetails) => booking.id === bookingId,
      );

      if (bookingIndex === -1) {
        return null;
      }

      allBookings[bookingIndex] = { ...allBookings[bookingIndex], ...updates };
      localStorage.setItem("user_bookings", JSON.stringify(allBookings));
      console.log("💾 Booking updated in localStorage");

      return allBookings[bookingIndex];
    } catch (error) {
      console.error("Failed to update booking in localStorage:", error);
      return null;
    }
  }

  /**
   * Clear all bookings (for testing)
   */
  clearAllBookings(): void {
    localStorage.removeItem("user_bookings");
    console.log("🗑️ All bookings cleared");
  }
}
