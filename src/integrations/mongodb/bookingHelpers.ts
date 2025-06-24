const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

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

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const bookingHelpers = {
  // ✅ Create new booking
  async createBooking(bookingData: Partial<Booking>) {
    try {
      const user = JSON.parse(localStorage.getItem("current_user") || "{}");
      const customerId = user?._id;

      if (!user._id) {
        throw new Error("Logged-in user ID not found in local storage");
      }

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...bookingData,
          customer_id: user._id, // ✅ use Mongo ObjectId from backend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to create booking" },
        };
      }

      return { data: data.booking, error: null };
    } catch (error: any) {
      console.error("Booking creation error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Get bookings for a specific customer
  async getUserBookings(userId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/customer/${userId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to fetch bookings" },
        };
      }

      return { data: data.bookings, error: null };
    } catch (error: any) {
      console.error("Bookings fetch error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Get pending bookings near a rider's location
  async getPendingBookingsForRiders(lat?: number, lng?: number) {
    try {
      let url = `${API_BASE_URL}/bookings/pending/0/0`;

      if (lat && lng) {
        url = `${API_BASE_URL}/bookings/pending/${lat}/${lng}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to fetch pending bookings" },
        };
      }

      return { data: data.bookings, error: null };
    } catch (error: any) {
      console.error("Pending bookings fetch error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Accept a booking as rider
  async acceptBooking(bookingId: string, riderId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/accept`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ rider_id: riderId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to accept booking" },
        };
      }

      return { data: data.booking, error: null };
    } catch (error: any) {
      console.error("Booking acceptance error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Update booking status
  async updateBookingStatus(
    bookingId: string,
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled",
    riderId?: string,
  ) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status,
            ...(riderId && { rider_id: riderId }),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to update booking status" },
        };
      }

      return { data: data.booking, error: null };
    } catch (error: any) {
      console.error("Booking status update error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Get all bookings (admin)
  async getAllBookings(page: number = 1, limit: number = 10, filters?: any) {
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...filters,
      });

      const response = await fetch(`${API_BASE_URL}/bookings?${queryParams}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to fetch bookings" },
        };
      }

      return {
        data: data.bookings,
        error: null,
        pagination: data.pagination,
      };
    } catch (error: any) {
      console.error("All bookings fetch error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Get booking by ID
  async getBookingById(bookingId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to fetch booking" },
        };
      }

      return { data: data.booking, error: null };
    } catch (error: any) {
      console.error("Booking fetch error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Cancel a booking
  async cancelBooking(bookingId: string, userId: string, userType: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          user_type: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to cancel booking" },
        };
      }

      return { data: data.booking, error: null };
    } catch (error: any) {
      console.error("Booking cancellation error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Get bookings for rider
  async getRiderBookings(riderId: string, status?: string) {
    try {
      const queryParams = status ? `?status=${status}` : "";

      const response = await fetch(
        `${API_BASE_URL}/bookings/rider/${riderId}${queryParams}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || "Failed to fetch rider bookings" },
        };
      }

      return { data: data.bookings, error: null };
    } catch (error: any) {
      console.error("Rider bookings fetch error:", error);
      return {
        data: null,
        error: { message: "Network error. Please check your connection." },
      };
    }
  },

  // Placeholder for clearing bookings (demo/testing)
  async clearUserBookings(userId: string) {
    try {
      console.log(
        "Clear bookings functionality would be implemented in admin panel",
      );

      return {
        data: { message: "Bookings cleared successfully" },
        error: null,
      };
    } catch (error: any) {
      console.error("Clear bookings error:", error);
      return {
        data: null,
        error: { message: "Failed to clear bookings" },
      };
    }
  },
};
