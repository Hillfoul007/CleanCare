import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  Smartphone,
  Monitor,
  Tablet,
  Shield,
  MessageCircle,
} from "lucide-react";
import { ExotelMissedCallService } from "@/services/exotelMissedCallService";
import { ResendEmailService } from "@/services/resendEmailService";
import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import { deviceDetection, DeviceInfo } from "@/utils/deviceDetection";

interface AdaptiveAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const AdaptiveAuthModal: React.FC<AdaptiveAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "method" | "phone" | "email" | "verify"
  >("method");
  const [authMethod, setAuthMethod] = useState<"missedcall" | "email">(
    "missedcall",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    otp: "",
    name: "",
  });

  const missedCallService = ExotelMissedCallService.getInstance();
  const emailService = ResendEmailService.getInstance();

  useEffect(() => {
    if (isOpen) {
      const info = deviceDetection.getDeviceInfo();
      setDeviceInfo(info);
      deviceDetection.logDeviceInfo();

      // Set default auth method based on device
      if (info.preferredAuthMethod === "missedcall") {
        setAuthMethod("missedcall");
        setCurrentStep("phone");
      } else if (info.preferredAuthMethod === "email") {
        setAuthMethod("email");
        setCurrentStep("email");
      } else {
        setCurrentStep("method"); // Show both options
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      phone: "",
      email: "",
      otp: "",
      name: "",
    });
    setError("");
    setSuccess("");
    setCurrentStep("method");
  };

  const handleMethodSelect = (method: "missedcall" | "email") => {
    setAuthMethod(method);
    setCurrentStep(method === "missedcall" ? "phone" : "email");
  };

  const handleMissedCallInitiate = async () => {
    if (!formData.phone) {
      setError("Please enter your phone number");
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number starting with 6-9",
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await missedCallService.initiateMissedCall(
        formData.phone,
        formData.name || "User",
      );

      if (result.success) {
        setSuccess(result.message || "Missed call initiated!");
        setCurrentStep("verify");
      } else {
        setError(result.error || "Failed to initiate missed call");
      }
    } catch (error: any) {
      setError(error.message || "Failed to initiate missed call");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOTPSend = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await emailService.sendEmailOTP(
        formData.email,
        formData.name || "User",
      );

      if (result.success) {
        setSuccess(result.message || "OTP sent to your email!");
        setCurrentStep("verify");
      } else {
        setError(result.error || "Failed to send email OTP");
      }
    } catch (error: any) {
      setError(error.message || "Failed to send email OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setIsLoading(true);
    setError("");

    try {
      let result;

      if (authMethod === "missedcall") {
        result = await missedCallService.verifyMissedCall(
          formData.phone,
          formData.name || "User",
        );
      } else {
        if (!formData.otp) {
          setError("Please enter the OTP");
          return;
        }
        result = await emailService.verifyEmailOTP(
          formData.email,
          formData.otp,
          formData.name || "User",
          formData.phone,
        );
      }

      if (result.success && result.user) {
        setSuccess("Login successful!");

        // Save user authentication to localStorage for persistence
        const authService = DVHostingSmsService.getInstance();
        authService.setCurrentUser(result.user);

        onSuccess(result.user);
        onClose();
        resetForm();
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (error: any) {
      setError(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleBack = () => {
    if (currentStep === "verify") {
      setCurrentStep(authMethod === "missedcall" ? "phone" : "email");
    } else if (currentStep === "phone" || currentStep === "email") {
      setCurrentStep("method");
    }
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  const getDeviceIcon = () => {
    if (!deviceInfo) return Monitor;
    if (deviceInfo.isMobile) return Smartphone;
    if (deviceInfo.isTablet) return Tablet;
    return Monitor;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {currentStep !== "method" && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-center flex-1">
              <div className="flex items-center justify-center gap-2">
                <DeviceIcon className="h-5 w-5 text-green-600" />
                Login to LaundryFlash
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Method Selection */}
          {currentStep === "method" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Choose your preferred login method
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleMethodSelect("missedcall")}
                  variant="outline"
                  className="w-full p-4 h-auto flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <Phone className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-medium">Missed Call Verification</div>
                    <div className="text-xs text-gray-500">
                      Quick & secure phone verification
                    </div>
                  </div>
                  {deviceInfo?.isMobile && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Recommended for mobile
                    </div>
                  )}
                </Button>

                <Button
                  onClick={() => handleMethodSelect("email")}
                  variant="outline"
                  className="w-full p-4 h-auto flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Mail className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-medium">Email Verification</div>
                    <div className="text-xs text-gray-500">
                      OTP sent to your email
                    </div>
                  </div>
                  {deviceInfo?.isDesktop && (
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Recommended for web
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Phone Step */}
          {currentStep === "phone" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Enter your mobile number for missed call verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number *</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-sm text-gray-600">🇮🇳 +91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    maxLength={10}
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  We'll call this number and disconnect immediately
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              )}

              <Button
                onClick={handleMissedCallInitiate}
                disabled={isLoading || !formData.phone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Initiating Call..." : "Get Missed Call"}
              </Button>

              {deviceInfo?.hasGoodKeyboardSupport && (
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => handleMethodSelect("email")}
                    className="text-sm text-blue-600"
                  >
                    Prefer email verification instead?
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Email Step */}
          {currentStep === "email" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Enter your email address to receive OTP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-sm text-gray-600">🇮🇳 +91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210 (optional)"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    maxLength={10}
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Phone number helps with order delivery
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              )}

              <Button
                onClick={handleEmailOTPSend}
                disabled={isLoading || !formData.email}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Sending OTP..." : "Send Email OTP"}
              </Button>

              {deviceInfo?.supportsPhoneCalls && (
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => handleMethodSelect("missedcall")}
                    className="text-sm text-green-600"
                  >
                    Prefer missed call verification instead?
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Verification Step */}
          {currentStep === "verify" && (
            <div className="space-y-4">
              <div className="text-center">
                <div
                  className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    authMethod === "missedcall" ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  {authMethod === "missedcall" ? (
                    <Phone className="h-6 w-6 text-green-600" />
                  ) : (
                    <Mail className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <h3 className="font-medium mb-1">
                  {authMethod === "missedcall"
                    ? "Missed Call Verification"
                    : "Check Your Email"}
                </h3>
                <p className="text-sm text-gray-600">
                  {authMethod === "missedcall"
                    ? `We'll call +91${formData.phone} and disconnect immediately. Please wait for the call.`
                    : `We sent a 6-digit code to ${formData.email}`}
                </p>
              </div>

              {authMethod === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={formData.otp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        otp: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the 6-digit code from your email
                  </p>
                  {window.location.hostname === "localhost" && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        🧪 <strong>Demo Mode:</strong> Enter{" "}
                        <strong>123456</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {authMethod === "missedcall" &&
                window.location.hostname === "localhost" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700">
                      🧪 <strong>Demo Mode:</strong> Click "Verify" to simulate
                      call verification
                    </p>
                  </div>
                )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              )}

              <Button
                onClick={handleVerification}
                disabled={
                  isLoading ||
                  (authMethod === "email" && formData.otp.length !== 6)
                }
                className={`w-full ${
                  authMethod === "missedcall"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading
                  ? "Verifying..."
                  : authMethod === "missedcall"
                    ? "I Received the Call"
                    : "Verify & Login"}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() =>
                    setCurrentStep(
                      authMethod === "missedcall" ? "phone" : "email",
                    )
                  }
                  className="text-sm text-gray-600"
                  disabled={isLoading}
                >
                  {authMethod === "missedcall"
                    ? "Didn't get a call? Try again"
                    : "Didn't receive email? Resend"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdaptiveAuthModal;
