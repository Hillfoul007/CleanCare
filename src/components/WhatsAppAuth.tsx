import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  MessageCircle,
  User,
  Phone,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { WhatsAppOTPService } from "@/services/whatsappOtpService";

interface WhatsAppAuthProps {
  onLoginSuccess: (user: any) => void;
  onClose?: () => void;
  onBack?: () => void;
}

const WhatsAppAuth: React.FC<WhatsAppAuthProps> = ({
  onLoginSuccess,
  onClose,
  onBack,
}) => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    otp: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const whatsappService = WhatsAppOTPService.getInstance();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    // Validate phone number
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !cleanPhone.match(/^[6-9]/)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setIsLoading(true);

    try {
      const result = await whatsappService.sendWhatsAppOTP(
        formData.phone,
        formData.name,
      );

      if (result.success) {
        setSuccess("OTP sent to your WhatsApp! Please check your messages.");
        setOtpSent(true);
        setStep("otp");
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (formData.otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const result = await whatsappService.verifyWhatsAppOTP(
        formData.phone,
        formData.otp,
        formData.name,
      );

      if (result.success && result.user) {
        setSuccess("Login successful! Welcome to CleanCare!");
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 1000);
      } else {
        setError(result.error || "OTP verification failed");
      }
    } catch (error) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await whatsappService.sendWhatsAppOTP(
        formData.phone,
        formData.name,
      );

      if (result.success) {
        setSuccess("New OTP sent to your WhatsApp!");
      } else {
        setError(result.error || "Failed to resend OTP");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setError("");
    setSuccess("");
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          {/* Back button */}
          {(onBack || onClose) && (
            <div className="flex justify-start mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "otp") {
                    handleBack();
                  } else if (onBack) {
                    onBack();
                  } else if (onClose) {
                    onClose();
                  }
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === "otp" ? "Back" : "Continue Shopping"}
              </Button>
            </div>
          )}

          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {step === "phone" ? "Welcome to CleanCare" : "Verify WhatsApp OTP"}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            {step === "phone"
              ? "Enter your details to get started"
              : `OTP sent to +91 ${formData.phone}`}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Phone & Name Step */}
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <div className="flex mt-1">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                    <span className="text-sm text-gray-600">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    className="rounded-l-none"
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send an OTP to this WhatsApp number
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send WhatsApp OTP
                  </>
                )}
              </Button>
            </form>
          )}

          {/* OTP Verification Step */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Enter 6-digit OTP
                </Label>
                <Input
                  id="otp"
                  type="tel"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  className="mt-1 text-center text-lg tracking-widest"
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Check your WhatsApp for the verification code
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify & Login
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                  disabled={isLoading}
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </form>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* WhatsApp Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span>Secure WhatsApp verification powered by Gupshup</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppAuth;
