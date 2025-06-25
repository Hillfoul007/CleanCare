export class Fast2SmsService {
  private static instance: Fast2SmsService;
  private currentPhone: string = "";

  constructor() {
    console.log("✅ Fast2SMS service initialized (using backend API)");
  }

  public static getInstance(): Fast2SmsService {
    if (!Fast2SmsService.instance) {
      Fast2SmsService.instance = new Fast2SmsService();
    }
    return Fast2SmsService.instance;
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      // Clean phone number (remove +91 if present)
      const cleanPhone = phoneNumber.replace(/^\+91/, "");

      // Validate Indian phone number
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error("Invalid Indian phone number");
      }

      // Call backend API instead of Fast2SMS directly to avoid CORS issues
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ OTP sent successfully:", result);

        if (result.success) {
          // Store phone for verification
          this.currentPhone = cleanPhone;
          return true;
        } else {
          console.error("❌ Backend API error:", result);
          return false;
        }
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("❌ Backend API error:", response.status, errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error("❌ Backend HTTP error:", response.status, errorText);
          errorMessage = errorText;
        }
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to send OTP:", error);
      console.error("❌ Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const cleanPhone = phoneNumber.replace(/^\+91/, "");

      // Call backend API for OTP verification
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: otp,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          console.log("✅ OTP verified successfully");
          // Clear stored data after successful verification
          this.currentPhone = "";
          return true;
        } else {
          console.log("❌ Invalid OTP:", result.message);
          return false;
        }
      } else {
        try {
          const errorData = await response.json();
          console.error("❌ Backend API error:", response.status, errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error("❌ Backend HTTP error:", response.status, errorText);
        }
        return false;
      }
    } catch (error) {
      console.error("❌ OTP verification error:", error);
      return false;
    }
  }

  async sendSmsOTP(
    phoneNumber: string,
    name?: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const success = await this.sendOTP(phoneNumber);
    return {
      success,
      message: success
        ? "OTP sent successfully via Fast2SMS"
        : "Failed to send OTP",
      error: success ? undefined : "Failed to send OTP via Fast2SMS",
    };
  }

  async verifySmsOTP(
    phoneNumber: string,
    otp: string,
    name?: string,
  ): Promise<{
    success: boolean;
    user?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const cleanPhone = phoneNumber.replace(/^\+91/, "");

      // Call backend API for OTP verification with user name
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: otp,
          name:
            name && name.trim() ? name.trim() : `User ${cleanPhone.slice(-4)}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data && result.data.user) {
          console.log("✅ OTP verified successfully");

          // Format user data for frontend
          const user = {
            id: result.data.user._id,
            phone: result.data.user.phone,
            full_name: result.data.user.name,
            user_type: "customer",
            token: result.data.token,
          };

          this.login(user);
          this.currentPhone = "";

          return {
            success: true,
            user,
            message: result.message || "Login successful",
          };
        } else {
          return {
            success: false,
            message: result.message || "Invalid OTP",
            error: result.message || "Invalid OTP",
          };
        }
      } else {
        let errorMessage = "Verification failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("❌ Backend API error:", response.status, errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error("❌ Backend HTTP error:", response.status, errorText);
          errorMessage = `HTTP ${response.status}: ${errorText}`;
        }
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      return {
        success: false,
        message: "Verification failed",
        error: error.message || "Network error",
      };
    }
  }

  login(userData: any): void {
    try {
      localStorage.setItem("cleancare_user", JSON.stringify(userData));
      localStorage.setItem("cleancare_auth_token", "authenticated");
      console.log("✅ User logged in:", userData.phone);
    } catch (error) {
      console.error("❌ Login storage failed:", error);
    }
  }

  logout(): void {
    try {
      localStorage.removeItem("cleancare_user");
      localStorage.removeItem("cleancare_auth_token");
      this.storedOTP = "";
      this.currentPhone = "";
      console.log("✅ User logged out");
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  }

  getCurrentUser(): any {
    try {
      const user = localStorage.getItem("cleancare_user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("❌ Failed to get current user:", error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("cleancare_auth_token");
  }
}

export default Fast2SmsService;
