export class Fast2SmsService {
  private static instance: Fast2SmsService;
  private apiKey: string;
  private storedOTP: string = "";
  private currentPhone: string = "";

  constructor() {
    this.apiKey =
      import.meta.env.VITE_FAST2SMS_API_KEY ||
      "AoPndbi8YuGmQU5FeZLVvw7chJM0ksgKHDN461rEqxTjlOIzC3UxV0QS1ZD7WKoIdGAmgC53lc6NTHjP";

    if (!this.apiKey) {
      console.error("❌ Fast2SMS API key not configured");
    } else {
      console.log("✅ Fast2SMS service initialized");
    }
  }

  public static getInstance(): Fast2SmsService {
    if (!Fast2SmsService.instance) {
      Fast2SmsService.instance = new Fast2SmsService();
    }
    return Fast2SmsService.instance;
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        throw new Error("Fast2SMS API key not configured");
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.storedOTP = otp;
      this.currentPhone = phoneNumber;

      // Clean phone number (remove +91 if present)
      const cleanPhone = phoneNumber.replace(/^\+91/, "");

      // Validate Indian phone number
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error("Invalid Indian phone number");
      }

      // Prepare message
      const message = `Your OTP for CleanCare laundry service is: ${otp}. Valid for 5 minutes.`;
      const encodedMessage = encodeURIComponent(message);

      // Fast2SMS API endpoint
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${this.apiKey}&route=otp&sender_id=FSTSMS&message=${encodedMessage}&language=english&flash=0&numbers=${cleanPhone}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ OTP sent successfully:", result);

        // Check if the API response indicates success
        if (result.return === true || result.request_id) {
          return true;
        } else {
          console.error("❌ Fast2SMS API error:", result);
          return false;
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Fast2SMS HTTP error:", response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to send OTP:", error);
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const cleanPhone = phoneNumber.replace(/^\+91/, "");
      const isValid =
        otp === this.storedOTP && cleanPhone === this.currentPhone;

      if (isValid) {
        console.log("✅ OTP verified successfully");
        // Clear stored OTP after successful verification
        this.storedOTP = "";
        this.currentPhone = "";
        return true;
      } else {
        console.log("❌ Invalid OTP or phone number");
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
    const isValid = await this.verifyOTP(phoneNumber, otp);

    if (isValid) {
      const cleanPhone = phoneNumber.replace(/^\+91/, "");
      const user = {
        id: Date.now().toString(),
        phone: cleanPhone,
        full_name:
          name && name.trim() ? name.trim() : `User ${cleanPhone.slice(-4)}`,
        user_type: "customer",
      };

      this.login(user);

      return {
        success: true,
        user,
        message: "Login successful",
      };
    } else {
      return {
        success: false,
        message: "Invalid OTP",
        error: "Invalid OTP",
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
