export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: "mobile" | "tablet" | "desktop";
  preferredAuthMethod: "missedcall" | "email" | "both";
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  hasGoodKeyboardSupport: boolean;
  supportsPhoneCalls: boolean;
}

export class DeviceDetectionService {
  private static instance: DeviceDetectionService;

  public static getInstance(): DeviceDetectionService {
    if (!DeviceDetectionService.instance) {
      DeviceDetectionService.instance = new DeviceDetectionService();
    }
    return DeviceDetectionService.instance;
  }

  /**
   * Detect device type and capabilities
   */
  getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // Mobile detection
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobile = mobileRegex.test(userAgent) || screenWidth <= 768;

    // Tablet detection
    const tabletRegex =
      /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|KFAPWI|KFAPWA|KFARWI|KFASWI|KFTHWI|KFTHWA|KFOT|KFTT|KFOT|KFTT/i;
    const isTablet =
      tabletRegex.test(userAgent) ||
      (screenWidth >= 768 && screenWidth <= 1024);

    // Desktop detection
    const isDesktop = !isMobile && !isTablet;

    // Determine device type
    let deviceType: "mobile" | "tablet" | "desktop";
    if (isMobile) {
      deviceType = "mobile";
    } else if (isTablet) {
      deviceType = "tablet";
    } else {
      deviceType = "desktop";
    }

    // Determine preferred authentication method
    let preferredAuthMethod: "missedcall" | "email" | "both";
    if (deviceType === "mobile") {
      preferredAuthMethod = "missedcall";
    } else if (deviceType === "desktop") {
      preferredAuthMethod = "email";
    } else {
      preferredAuthMethod = "both"; // Tablet users get both options
    }

    return {
      isMobile,
      isTablet,
      isDesktop,
      deviceType,
      preferredAuthMethod,
      userAgent,
      screenWidth,
      screenHeight,
      hasGoodKeyboardSupport: this.hasGoodKeyboardSupport(),
      supportsPhoneCalls: this.supportsPhoneCalls(),
    };
  }

  /**
   * Check if device supports phone calls
   */
  supportsPhoneCalls(): boolean {
    const deviceInfo = this.getDeviceInfo();
    return deviceInfo.isMobile;
  }

  /**
   * Check if device has good keyboard support for email
   */
  hasGoodKeyboardSupport(): boolean {
    const deviceInfo = this.getDeviceInfo();
    return deviceInfo.isDesktop || deviceInfo.isTablet;
  }

  /**
   * Get authentication method recommendations
   */
  getAuthRecommendations(): {
    primary: "missedcall" | "email";
    secondary?: "missedcall" | "email";
    message: string;
  } {
    const deviceInfo = this.getDeviceInfo();

    if (deviceInfo.isMobile) {
      return {
        primary: "missedcall",
        secondary: "email",
        message: "Quick login with missed call verification",
      };
    } else if (deviceInfo.isDesktop) {
      return {
        primary: "email",
        secondary: "missedcall",
        message: "Secure login with email verification",
      };
    } else {
      return {
        primary: "email",
        secondary: "missedcall",
        message: "Choose your preferred login method",
      };
    }
  }

  /**
   * Check if touch device
   */
  isTouchDevice(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get device capabilities
   */
  getCapabilities(): {
    hasCamera: boolean;
    hasLocation: boolean;
    hasNotifications: boolean;
    canMakePhoneCalls: boolean;
    hasGoodTyping: boolean;
  } {
    const deviceInfo = this.getDeviceInfo();

    return {
      hasCamera: "getUserMedia" in navigator.mediaDevices,
      hasLocation: "geolocation" in navigator,
      hasNotifications: "Notification" in window,
      canMakePhoneCalls: deviceInfo.isMobile,
      hasGoodTyping: deviceInfo.isDesktop || deviceInfo.isTablet,
    };
  }

  /**
   * Log device information for debugging
   */
  logDeviceInfo(): void {
    const deviceInfo = this.getDeviceInfo();
    const capabilities = this.getCapabilities();
    const recommendations = this.getAuthRecommendations();

    console.log("📱 Device Detection Results:", {
      deviceInfo,
      capabilities,
      recommendations,
    });
  }
}

export const deviceDetection = DeviceDetectionService.getInstance();
