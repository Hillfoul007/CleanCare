// This service has been replaced by Fast2SmsService
// Keeping file for backward compatibility but functionality moved to Fast2SMS OTP

export class ExotelMissedCallService {
  private static instance: ExotelMissedCallService;
  private apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
  private exotelApiKey = import.meta.env.VITE_EXOTEL_API_KEY || "";
  private exotelToken = import.meta.env.VITE_EXOTEL_TOKEN || "";
  private exotelNumber = import.meta.env.VITE_EXOTEL_NUMBER || "";
  private exotelPin = import.meta.env.VITE_EXOTEL_PIN || "";

  public static getInstance(): ExotelMissedCallService {
    if (!ExotelMissedCallService.instance) {
      ExotelMissedCallService.instance = new ExotelMissedCallService();
    }
    return ExotelMissedCallService.instance;
  }

  /**
   * Initiate missed call authentication
   */
  async initiateMissedCall(
    phoneNumber: string,
    name: string = "",
  ): Promise<ExotelResponse> {
    try {
      console.log(`📞 Initiating missed call to: ${phoneNumber}`);

      // Validate phone number (Indian format)
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length !== 10 || !cleanPhone.match(/^[6-9]/)) {
        return {
          success: false,
          error: "Please enter a valid 10-digit Indian mobile number",
        };
      }

      const fullPhoneNumber = `+91${cleanPhone}`;

      // Store pending verification
      const verificationData = {
        phone: fullPhoneNumber,
        name: name.trim(),
        timestamp: Date.now(),
        status: "pending",
      };

      sessionStorage.setItem(
        `missedcall_verification_${fullPhoneNumber}`,
        JSON.stringify(verificationData),
      );

      // In demo mode, simulate successful missed call initiation
      const isDemoMode =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isDemoMode) {
        console.log("🧪 Demo mode: Simulating missed call initiation");
        return {
          success: true,
          message:
            "Demo: Missed call initiated! Click 'Verify' to simulate receiving the call.",
          callId: `demo_call_${Date.now()}`,
        };
      }

      // Make actual Exotel API call for missed call
      const exotelUrl = `https://twilix.exotel.in/v1/Accounts/${this.exotelApiKey}/Calls/connect.json`;

      const formData = new URLSearchParams();
      formData.append("From", this.exotelNumber);
      formData.append("To", fullPhoneNumber);
      formData.append("CallType", "trans");
      formData.append("TimeLimit", "10"); // 10 seconds

      const response = await fetch(exotelUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${this.exotelApiKey}:${this.exotelToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (response.ok && result.Call) {
        console.log("✅ Missed call initiated successfully via Exotel");
        return {
          success: true,
          message:
            "Missed call initiated! Please wait for the call and then verify.",
          callId: result.Call.Sid,
        };
      } else {
        console.error("❌ Exotel API error:", result);
        return {
          success: false,
          error: result.message || "Failed to initiate missed call",
        };
      }
    } catch (error) {
      console.error("❌ Missed call initiation failed:", error);

      // Fallback to demo mode on network error
      console.log("🔄 Network error detected, falling back to demo mode");
      return {
        success: true,
        message: "Demo mode: Click 'Verify' to simulate call verification",
        callId: `demo_call_${Date.now()}`,
      };
    }
  }

  /**
   * Verify missed call (user confirms they received the call)
   */
  async verifyMissedCall(
    phoneNumber: string,
    name: string,
  ): Promise<ExotelResponse> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const fullPhoneNumber = `+91${cleanPhone}`;

      // Get stored verification data
      const storedData = sessionStorage.getItem(
        `missedcall_verification_${fullPhoneNumber}`,
      );

      if (!storedData) {
        return {
          success: false,
          error:
            "No pending verification found. Please initiate missed call first.",
        };
      }

      const verificationData = JSON.parse(storedData);

      // Check if verification is not too old (5 minutes)
      if (Date.now() - verificationData.timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem(`missedcall_verification_${fullPhoneNumber}`);
        return {
          success: false,
          error: "Verification expired. Please initiate missed call again.",
        };
      }

      // Create/login user
      const user = await this.createOrLoginUser(fullPhoneNumber, name);

      // Clear verification data
      sessionStorage.removeItem(`missedcall_verification_${fullPhoneNumber}`);

      // Store user session
      localStorage.setItem("cleancare_user", JSON.stringify(user));
      localStorage.setItem(
        "cleancare_auth_token",
        `missedcall_${user.id}_${Date.now()}`,
      );

      // Clear previous orders
      this.clearPreviousOrders();

      console.log("✅ Missed call verification successful");
      return {
        success: true,
        message: "Login successful via missed call verification",
        user,
      };
    } catch (error) {
      console.error("❌ Missed call verification failed:", error);
      return {
        success: false,
        error: "Verification failed. Please try again.",
      };
    }
  }

  /**
   * Create or login user
   */
  private async createOrLoginUser(
    phoneNumber: string,
    name: string,
  ): Promise<User> {
    try {
      // Try to get existing user from backend
      const response = await fetch(`${this.apiBaseUrl}/auth/missedcall-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          name: name.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.user;
      } else {
        // If backend call fails, create user locally
        throw new Error("Backend unavailable");
      }
    } catch (error) {
      console.log("⚠️ Backend unavailable, creating user locally");

      // Create user locally
      const userId = `missedcall_${phoneNumber}_${Date.now()}`;
      const user: User = {
        id: userId,
        name: name.trim(),
        phone: phoneNumber,
        createdAt: new Date().toISOString(),
        isVerified: true,
        verificationType: "missedcall",
      };

      return user;
    }
  }

  /**
   * Clear all previous orders
   */
  private clearPreviousOrders(): void {
    try {
      // Clear localStorage orders
      localStorage.removeItem("laundry_cart");
      localStorage.removeItem("booking_history");
      localStorage.removeItem("user_bookings");
      localStorage.removeItem("cleancare_orders");

      // Clear sessionStorage orders
      sessionStorage.removeItem("current_order");
      sessionStorage.removeItem("cart_items");

      console.log("🗑️ All previous orders cleared");
    } catch (error) {
      console.error("Error clearing orders:", error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem("cleancare_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    const token = localStorage.getItem("cleancare_auth_token");
    return !!(user && token);
  }

  /**
   * Logout user
   */
  logout(): void {
    try {
      // Clear user data
      localStorage.removeItem("cleancare_user");
      localStorage.removeItem("cleancare_auth_token");

      // Clear orders
      this.clearPreviousOrders();

      // Clear any session data
      sessionStorage.clear();

      console.log("👋 User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }
}
