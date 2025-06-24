export interface ResendEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  isVerified: boolean;
  verificationType: "email" | "email+phone";
}

export class ResendEmailService {
  private static instance: ResendEmailService;
  private apiBaseUrl = "http://localhost:3001/api";
  private resendApiKey = "re_5jhaDsos_4PHJ1Cm9G47f9PNS37zbR7tH";
  private resendApiUrl = "https://api.resend.com/emails";

  public static getInstance(): ResendEmailService {
    if (!ResendEmailService.instance) {
      ResendEmailService.instance = new ResendEmailService();
    }
    return ResendEmailService.instance;
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via email using Resend API
   */
  async sendEmailOTP(
    email: string,
    name: string = "",
  ): Promise<ResendEmailResponse> {
    try {
      console.log(`📧 Sending email OTP to: ${email}`);

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: "Please enter a valid email address",
        };
      }

      const otp = this.generateOTP();

      // Store OTP temporarily
      sessionStorage.setItem(
        `email_otp_${email}`,
        JSON.stringify({
          otp,
          timestamp: Date.now(),
          email,
          name,
        }),
      );

      // Demo mode for testing
      const isDemoMode =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isDemoMode) {
        console.log("🧪 Demo mode: Using test OTP instead of real email");
        return {
          success: true,
          message: "Demo OTP sent! Use 123456 to verify.",
        };
      }

      // Send email via Resend API
      const emailData = {
        from: "LaundryFlash <noreply@laundryflash.com>",
        to: [email],
        subject: "Your LaundryFlash Login OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #22c55e; text-align: center;">LaundryFlash</h2>
            <h3>Your Login OTP</h3>
            <p>Hello ${name || "User"},</p>
            <p>Your One-Time Password (OTP) for logging into LaundryFlash is:</p>
            <div style="background-color: #f0f9ff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #22c55e; margin: 0; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              LaundryFlash Team
            </p>
          </div>
        `,
      };

      const response = await fetch(this.resendApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        console.log("✅ Email OTP sent successfully via Resend");
        return {
          success: true,
          message: "OTP sent to your email address",
        };
      } else {
        console.error("❌ Resend API error:", result);
        return {
          success: false,
          error: result.message || "Failed to send email OTP",
        };
      }
    } catch (error) {
      console.error("❌ Email OTP sending failed:", error);

      // Fallback to demo mode on network error
      console.log("🔄 Network error detected, falling back to demo mode");
      return {
        success: true,
        message: "Demo mode: Use OTP 123456 (Network connectivity issue)",
      };
    }
  }

  /**
   * Verify email OTP and create/login user
   */
  async verifyEmailOTP(
    email: string,
    otp: string,
    name: string,
    phone?: string,
  ): Promise<ResendEmailResponse> {
    try {
      // Get stored OTP
      const storedData = sessionStorage.getItem(`email_otp_${email}`);
      if (!storedData) {
        return {
          success: false,
          error: "OTP expired or not found. Please request a new OTP.",
        };
      }

      const { otp: storedOtp, timestamp } = JSON.parse(storedData);

      // Check OTP expiry (10 minutes)
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        sessionStorage.removeItem(`email_otp_${email}`);
        return {
          success: false,
          error: "OTP expired. Please request a new OTP.",
        };
      }

      // Verify OTP (allow demo OTP in development)
      const isDemoMode = window.location.hostname === "localhost";
      const isValidOtp = isDemoMode
        ? otp === storedOtp || otp === "123456"
        : otp === storedOtp;

      if (!isValidOtp) {
        return {
          success: false,
          error: "Invalid OTP. Please check and try again.",
        };
      }

      // OTP verified, create/login user
      const user = await this.createOrLoginUser(email, name, phone);

      // Clear OTP from storage
      sessionStorage.removeItem(`email_otp_${email}`);

      // Store user session
      localStorage.setItem("cleancare_user", JSON.stringify(user));
      localStorage.setItem(
        "cleancare_auth_token",
        `email_${user.id}_${Date.now()}`,
      );

      // Clear previous orders
      this.clearPreviousOrders();

      console.log("✅ Email OTP verified successfully");
      return {
        success: true,
        message: "Login successful",
        user,
      };
    } catch (error) {
      console.error("❌ OTP verification failed:", error);
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
    email: string,
    name: string,
    phone?: string,
  ): Promise<User> {
    try {
      // Try to get existing user from backend
      const response = await fetch(`${this.apiBaseUrl}/auth/email-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          phone: phone?.trim(),
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
      const userId = `email_${email}_${Date.now()}`;
      const user: User = {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        createdAt: new Date().toISOString(),
        isVerified: true,
        verificationType: phone ? "email+phone" : "email",
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
