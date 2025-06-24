import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  Phone,
  User,
  Shield,
  MessageSquare,
} from "lucide-react";
import { TwilioSmsService } from "@/services/twilioSmsService";

interface PhoneOtpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const PhoneOtpAuthModal: React.FC<PhoneOtpAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    name: "",
  });

  const twilioService = TwilioSmsService.getInstance();

  const resetForm = () => {
    setFormData({
      phone: "",
      otp: "",
      name: "",
    });
    setError("");
    setSuccess("");
    setCurrentStep("phone");
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOTP = async () => {
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
      const result = await twilioService.sendOTP(formData.phone);

      if (result.success) {
        setSuccess(result.message || "OTP sent to your phone!");
        setCurrentStep("otp");
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch (error: any) {
      setError(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      setError("Please enter the OTP");
      return;
    }

    if (formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await twilioService.verifySmsOTP(
        formData.phone,
        formData.otp,
        formData.name || "User",
      );

      if (result.success && result.user) {
        setSuccess("Login successful!");
        onSuccess(result.user);
        onClose();
        resetForm();
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (error: any) {
      setError(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep("phone");
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {currentStep === "otp" && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-center flex-1">
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                {currentStep === "phone" ? "Sign In with Phone" : "Verify OTP"}
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone Step */}
          {currentStep === "phone" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Enter your mobile number to receive OTP via SMS
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
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
                  OTP will be sent to this number via SMS
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
                onClick={handleSendOTP}
                disabled={isLoading || !formData.phone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Sending OTP..." : "Send OTP via SMS"}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to receive SMS messages from
                  LaundryFlash
                </p>
                {window.location.hostname === "localhost" && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700">
                      🧪 <strong>Demo Mode:</strong> Use OTP{" "}
                      <strong>123456</strong> to test login
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTP Step */}
          {currentStep === "otp" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium mb-1">Check your messages</h3>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to +91{formData.phone}
                </p>
              </div>

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
                  Enter the 6-digit code from SMS
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
                onClick={handleVerifyOTP}
                disabled={isLoading || formData.otp.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={handleSendOTP}
                  className="text-sm text-green-600"
                  disabled={isLoading}
                >
                  Didn't receive SMS? Resend OTP
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneOtpAuthModal;
