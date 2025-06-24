import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  MessageCircle,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { OTPAuthService } from "@/services/otpAuthService";
import PushNotificationService from "@/services/pushNotificationService";

interface OTPAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

type AuthStep = "phone" | "otp" | "name" | "notifications";

const OTPAuth: React.FC<OTPAuthProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  const authService = OTPAuthService.getInstance();
  const pushService = PushNotificationService.getInstance();

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setName("");
      setError("");
      setOtpSent(false);
      setCountdown(0);
      setIsNewUser(false);
    }
  }, [isOpen]);

  // Initialize PWA when component mounts
  useEffect(() => {
    pushService.initializePWA();
  }, []);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.sendOTP(phone);

      if (result.success) {
        setOtpSent(true);
        setStep("otp");
        setCountdown(30); // 30 seconds countdown
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.verifyOTP(otp, name);

      if (result.success) {
        const user = result.data.user;

        // Check if user needs to provide name
        if (!user.name && step !== "name") {
          setIsNewUser(true);
          setStep("name");
          setLoading(false);
          return;
        }

        // Proceed to notifications setup
        setStep("notifications");
        setLoading(false);
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.");
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.verifyOTP(otp, name);

      if (result.success) {
        setStep("notifications");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to save name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupNotifications = async () => {
    setLoading(true);

    try {
      // Check if push notifications are supported
      if (pushService.isPushSupported()) {
        const permission = await pushService.requestPermission();

        if (permission === "granted") {
          await pushService.subscribeToPush();
        }
      }

      // Complete authentication
      const user = authService.getCurrentUser();
      if (user) {
        onLoginSuccess(user);
        onClose();
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
      // Continue even if notifications fail
      const user = authService.getCurrentUser();
      if (user) {
        onLoginSuccess(user);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    const user = authService.getCurrentUser();
    if (user) {
      onLoginSuccess(user);
      onClose();
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError("");

    try {
      const result = await authService.resendOTP();

      if (result.success) {
        setCountdown(30);
        setError("");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
      setError("");
    } else if (step === "name") {
      setStep("otp");
      setName("");
      setError("");
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers;
    }
    return numbers.slice(0, 10);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(step === "otp" || step === "name") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-1 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <span>
                {step === "phone" && "Sign In"}
                {step === "otp" && "Verify OTP"}
                {step === "name" && "Complete Profile"}
                {step === "notifications" && "Enable Notifications"}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {step === "phone" && "Enter your mobile number to continue"}
            {step === "otp" &&
              `Enter the OTP sent to ${authService.formatPhoneNumber(phone)}`}
            {step === "name" &&
              "Please provide your name to complete registration"}
            {step === "notifications" &&
              "Stay updated with order notifications"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Number Step */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(formatPhoneNumber(e.target.value))
                    }
                    className="pl-10 rounded-xl"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  We'll send you an OTP to verify your number
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.length !== 10}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="text-center text-lg tracking-widest rounded-xl"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Didn't receive OTP?</span>
                <Button
                  variant="link"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="p-0 h-auto text-green-600"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </Button>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          )}

          {/* Name Input Step */}
          {step === "name" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleSaveName}
                disabled={loading || !name.trim()}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}

          {/* Notifications Setup Step */}
          {step === "notifications" && (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="font-semibold text-green-900">
                      Authentication Complete!
                    </h3>
                    <p className="text-green-700 text-sm">
                      Enable push notifications to get real-time updates about
                      your orders
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* iOS PWA Instructions */}
              {pushService.isIOSSafari() && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-900">
                      Install CleanCare App (iOS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      {pushService
                        .getIOSInstallInstructions()
                        .map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipNotifications}
                  className="flex-1 rounded-xl"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleSetupNotifications}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Enable Notifications"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPAuth;
