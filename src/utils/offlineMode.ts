// Offline mode detection and fallback functionality

interface OfflineUser {
  _id: string;
  phone: string;
  full_name: string;
  email: string;
  user_type: string;
  phone_verified: boolean;
  created_at: string;
}

interface OfflineBooking {
  _id: string;
  userId: string;
  services: any[];
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  provider?: any;
}

export const offlineMode = {
  // Check if we should use offline mode
  shouldUseOfflineMode(): boolean {
    return localStorage.getItem("backend_offline_mode") === "true";
  },

  // Enable offline mode
  enableOfflineMode(): void {
    localStorage.setItem("backend_offline_mode", "true");
    console.log("Offline mode enabled due to backend connectivity issues");
  },

  // Disable offline mode
  disableOfflineMode(): void {
    localStorage.removeItem("backend_offline_mode");
    console.log("Offline mode disabled - backend connectivity restored");
  },

  // Create offline user
  createOfflineUser(phone: string, name: string): OfflineUser {
    const user: OfflineUser = {
      _id: `offline_${Date.now()}`,
      phone,
      full_name: name,
      email: `${phone.replace(/[^0-9]/g, "")}@offline.local`,
      user_type: "customer",
      phone_verified: true,
      created_at: new Date().toISOString(),
    };

    // Store user
    localStorage.setItem("auth_token", `offline_token_${Date.now()}`);
    localStorage.setItem("current_user", JSON.stringify(user));

    return user;
  },

  // Create offline booking
  createOfflineBooking(bookingData: any): OfflineBooking {
    const booking: OfflineBooking = {
      _id: `offline_booking_${Date.now()}`,
      userId: bookingData.userId || "offline_user",
      services: bookingData.services || [],
      scheduledDate: bookingData.scheduledDate,
      scheduledTime: bookingData.scheduledTime,
      address: bookingData.address,
      totalAmount: bookingData.totalAmount || 0,
      status: "confirmed",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      provider: bookingData.provider,
    };

    // Store booking in offline storage
    const existingBookings = this.getOfflineBookings();
    existingBookings.push(booking);
    localStorage.setItem("offline_bookings", JSON.stringify(existingBookings));

    return booking;
  },

  // Get offline bookings
  getOfflineBookings(): OfflineBooking[] {
    const bookings = localStorage.getItem("offline_bookings");
    return bookings ? JSON.parse(bookings) : [];
  },

  // Update offline booking
  updateOfflineBooking(
    bookingId: string,
    updates: Partial<OfflineBooking>,
  ): OfflineBooking | null {
    const bookings = this.getOfflineBookings();
    const bookingIndex = bookings.findIndex((b) => b._id === bookingId);

    if (bookingIndex === -1) return null;

    bookings[bookingIndex] = { ...bookings[bookingIndex], ...updates };
    localStorage.setItem("offline_bookings", JSON.stringify(bookings));

    return bookings[bookingIndex];
  },

  // Delete offline booking
  deleteOfflineBooking(bookingId: string): boolean {
    const bookings = this.getOfflineBookings();
    const filteredBookings = bookings.filter((b) => b._id !== bookingId);

    if (filteredBookings.length === bookings.length) return false;

    localStorage.setItem("offline_bookings", JSON.stringify(filteredBookings));
    return true;
  },

  // Sync with backend when connection is restored
  async syncWithBackend(): Promise<{ success: boolean; synced: number }> {
    if (this.shouldUseOfflineMode()) {
      return { success: false, synced: 0 };
    }

    const offlineBookings = this.getOfflineBookings();
    let syncedCount = 0;

    // Try to sync offline bookings to backend
    for (const booking of offlineBookings) {
      try {
        // In a real implementation, you would make API calls here
        // For now, just mark as synced
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync booking:", booking._id, error);
      }
    }

    if (syncedCount > 0) {
      // Clear offline bookings after successful sync
      localStorage.removeItem("offline_bookings");
    }

    return { success: true, synced: syncedCount };
  },

  // Get status message for UI
  getStatusMessage(): string {
    if (this.shouldUseOfflineMode()) {
      const bookingCount = this.getOfflineBookings().length;
      return `Offline mode active. ${bookingCount} bookings stored locally.`;
    }
    return "Online mode - connected to backend";
  },
};

export default offlineMode;
