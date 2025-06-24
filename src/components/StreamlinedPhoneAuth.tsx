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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, MessageSquare, User, CheckCircle } from "lucide-react";

interface StreamlinedPhoneAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

type AuthStep = "phone" | "otp" | "name" | "success";

const StreamlinedPhoneAuth: React.FC<StreamlinedPhoneAuthProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, "");

    // Limit to 10 digits
    if (phoneNumber.length <= 10) {
      return phoneNumber;
    }
    return phoneNumber.slice(0, 10);
  };

  const validatePhone = (phoneNumber: string) => {
    return phoneNumber.length === 10 && /^\d{10}$/.test(phoneNumber);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePhone(phone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    // Simulate OTP sending (in real app, you'd call your backend)
    try {
      // For demo purposes, just move to OTP step
      setTimeout(() => {
        setLoading(false);
        setStep("otp");
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    // Simulate OTP verification
    try {
      setTimeout(() => {
        setLoading(false);
        setStep("name");
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://auth-back-ula7.onrender.com/api";

      const response = await fetch(`${API_BASE_URL}/auth/register-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${phone}`,
          name: name.trim(),
          userType: "customer",
          verified: true, // Since we "verified" the OTP
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save to localStorage
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("current_user", JSON.stringify(data.user));

        setStep("success");

        // Call success callback after showing success message
        setTimeout(() => {
          onSuccess(data.user);
          resetForm();
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setName("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case "phone":
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <Phone className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Enter Your Phone Number
              </h3>
              <p className="text-sm text-gray-600">
                We'll send you an OTP to verify
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex mt-1">
                <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                  <span className="text-gray-600 text-sm">+91</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="rounded-l-none"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !validatePhone(phone)}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        );

      case "otp":
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <MessageSquare className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Enter OTP</h3>
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to +91{phone}
              </p>
            </div>

            <div>
              <Label htmlFor="otp">6-Digit OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("phone")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setStep("phone")}
              >
                Change phone number?
              </button>
            </div>
          </form>
        );

      case "name":
        return (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                What's Your Name?
              </h3>
              <p className="text-sm text-gray-600">
                Help us personalize your experience
              </p>
            </div>

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("otp")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !name.trim()}
              >
                {loading ? "Creating Account..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to HomeServices!
            </h3>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Phone:</strong> +91{phone}
                <br />
                <strong>Name:</strong> {name}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === "success" ? "Account Created!" : "Sign In with Phone"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}
        </div>

        {step !== "success" && (
          <div className="text-center text-xs text-gray-500 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StreamlinedPhoneAuth;
