// Adaptive booking helpers that work both online and offline
import { adaptiveApi } from "../../utils/adaptiveApiClient";

interface Booking {
  _id?: string;
  customer_id: string;
  rider_id?: string;
  service: string;
  service_type: string;
  services: string[];
  scheduled_date: string;
  scheduled_time: string;
  provider_name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  additional_details?: string;
  total_price: number;
  discount_amount?: number;
  final_amount: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  created_at?: Date;
  updated_at?: Date;
  estimated_duration?: number;
  special_instructions?: string;
  charges_breakdown?: {
    base_price: number;
    tax_amount: number;
    service_fee: number;
    discount: number;
  };
}

export const adaptiveBookingHelpers = {
  // Create new booking with automatic fallback
  async createBooking(bookingData: Partial<Booking>) {
    try {
      const user = JSON.parse(localStorage.getItem("current_user") || "{}");

      if (!user._id) {
        throw new Error("Please sign in to create a booking");
      }

      const result = await adaptiveApi.createBooking({
        ...bookingData,
        customer_id: user._id,
      });

      if (result.error) {
        return { data: null, error: { message: result.error } };
      }

      return { data: result.data, error: null };
    } catch (error: any) {
      console.error("Booking creation failed:", error);
      return {
        data: null,
        error: { message: error.message || "Failed to create booking" },
      };
    }
  },

  // Get user bookings with automatic fallback
  async getUserBookings(userId: string) {
    try {
      // For offline mode, get from localStorage
      const apiStatus = adaptiveApi.getStatus();

      if (!apiStatus.isOnline) {
        const offlineBookings = JSON.parse(
          localStorage.getItem("offline_bookings") || "[]",
        );
        const userBookings = offlineBookings.filter(
          (booking: any) =>
            booking.customer_id === userId || booking.userId === userId,
        );

        // Return empty array if no bookings found

        return { data: userBookings, error: null };
      }

      // If online, try to get from backend (this would need to be implemented)
      return { data: [], error: null };
    } catch (error: any) {
      console.error("Failed to get user bookings:", error);
      return {
        data: [],
        error: { message: error.message || "Failed to retrieve bookings" },
      };
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string) {
    try {
      const allBookings = JSON.parse(
        localStorage.getItem("offline_bookings") || "[]",
      );
      const bookingIndex = allBookings.findIndex(
        (b: any) => b._id === bookingId,
      );

      if (bookingIndex === -1) {
        return { data: null, error: { message: "Booking not found" } };
      }

      allBookings[bookingIndex].status = status;
      allBookings[bookingIndex].updated_at = new Date().toISOString();

      localStorage.setItem("offline_bookings", JSON.stringify(allBookings));

      return { data: allBookings[bookingIndex], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: { message: error.message || "Failed to update booking" },
      };
    }
  },

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string) {
    try {
      const allBookings = JSON.parse(
        localStorage.getItem("offline_bookings") || "[]",
      );
      const bookingIndex = allBookings.findIndex(
        (b: any) => b._id === bookingId,
      );

      if (bookingIndex === -1) {
        return { data: null, error: { message: "Booking not found" } };
      }

      allBookings[bookingIndex].status = "cancelled";
      allBookings[bookingIndex].cancellation_reason =
        reason || "Cancelled by user";
      allBookings[bookingIndex].updated_at = new Date().toISOString();

      localStorage.setItem("offline_bookings", JSON.stringify(allBookings));

      return { data: allBookings[bookingIndex], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: { message: error.message || "Failed to cancel booking" },
      };
    }
  },

  // Update booking with new details including services
  async updateBooking(bookingId: string, updatedData: Partial<Booking>) {
    try {
      const allBookings = JSON.parse(
        localStorage.getItem("offline_bookings") || "[]",
      );
      const bookingIndex = allBookings.findIndex(
        (b: any) => b._id === bookingId,
      );

      if (bookingIndex === -1) {
        return { data: null, error: { message: "Booking not found" } };
      }

      // Update the booking with new data
      allBookings[bookingIndex] = {
        ...allBookings[bookingIndex],
        ...updatedData,
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem("offline_bookings", JSON.stringify(allBookings));

      return { data: allBookings[bookingIndex], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: { message: error.message || "Failed to update booking" },
      };
    }
  },
};

export default adaptiveBookingHelpers;
