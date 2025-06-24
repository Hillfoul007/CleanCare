export class TwilioSmsService {
  private static instance: TwilioSmsService;
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private storedOTP: string = "";
  private currentPhone: string = "";

  constructor() {
    this.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || "";
    this.authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || "";
    this.phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || "";

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      console.error("❌ Twilio credentials not configured");
    }
  }

  public static getInstance(): TwilioSmsService {
    if (!TwilioSmsService.instance) {
      TwilioSmsService.instance = new TwilioSmsService();
    }
    return TwilioSmsService.instance;
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.accountSid || !this.authToken || !this.phoneNumber) {
        throw new Error("Twilio credentials not configured");
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.storedOTP = otp;
      this.currentPhone = phoneNumber;

      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;

      // Send SMS via Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " + btoa(`${this.accountSid}:${this.authToken}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: this.phoneNumber,
            To: formattedPhone,
            Body: `Your OTP for CleanCare laundry service is: ${otp}. Valid for 5 minutes.`,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ OTP sent successfully:", result.sid);
        return true;
      } else {
        const error = await response.json();
        console.error("❌ Twilio API error:", error);
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to send OTP:", error);
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const isValid =
        otp === this.storedOTP && phoneNumber === this.currentPhone;

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
      message: success ? "OTP sent successfully" : "Failed to send OTP",
      error: success ? undefined : "Failed to send OTP",
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
      const user = {
        id: Date.now().toString(),
        phone: phoneNumber,
        full_name: name || "User",
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

export default TwilioSmsService;
