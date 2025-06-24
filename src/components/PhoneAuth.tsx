import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Phone, User, Shield } from "lucide-react";
import { adaptiveApi } from "../utils/adaptiveApiClient";

interface PhoneAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<"phone" | "otp" | "name">(
    "phone",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    name: "",
  });

  const [generatedOTP, setGeneratedOTP] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const resetForm = () => {
    setFormData({
      phone: "",
      otp: "",
      name: "",
    });
    setError("");
    setSuccess("");
    setCurrentStep("phone");
    setGeneratedOTP("");
    setIsNewUser(false);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    try {
      // Check if phone exists using adaptive API
      const result = await adaptiveApi.checkPhone(formData.phone);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.isOffline) {
        setIsNewUser(true);
        setSuccess("📱 Demo OTP sent (Offline mode - any 6 digits work)");
      } else {
        setIsNewUser(!result.data?.exists);
      }

      // Generate demo OTP (in production, this would be sent via SMS)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(otp);

      const isOfflineMode = window.location.hostname !== "localhost";
      const message = isOfflineMode
        ? `📱 Demo OTP: ${otp} (Offline mode - any 6 digits work)`
        : `Demo OTP sent: ${otp} (In production, this would be sent via SMS)`;

      setSuccess(message);
      setCurrentStep("otp");
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    }

    setIsLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    // Verify OTP (demo verification)
    const isOfflineMode = window.location.hostname !== "localhost";
    const isValidOTP = isOfflineMode
      ? formData.otp.length === 6 && /^\d{6}$/.test(formData.otp) // Any 6 digits in offline mode
      : formData.otp === generatedOTP; // Exact match in local mode

    if (!isValidOTP) {
      const errorMsg = isOfflineMode
        ? "Please enter any 6 digits for demo OTP."
        : "Invalid OTP. Please try again.";
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    try {
      if (isNewUser) {
        // New user - ask for name
        setCurrentStep("name");
      } else {
        // Existing user - sign them in
        await signInExistingUser();
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    }

    setIsLoading(false);
  };

  const signInExistingUser = async () => {
    try {
      // For existing users with phone auth, we need to simulate sign in
      // since the existing backend uses email/password authentication
      // In a production app, you'd need a dedicated phone auth endpoint

      const existingUser = {
        _id: `phone_user_${Date.now()}`,
        phone: formData.phone,
        full_name: "Phone User", // In production, fetch from database
        user_type: "customer",
        phone_verified: true,
        created_at: new Date().toISOString(),
        // Generate a temporary email for compatibility
        email: `${formData.phone.replace(/[^0-9]/g, "")}@phone.local`,
      };

      // Store in localStorage (temporary token for phone auth)
      localStorage.setItem("auth_token", `phone_token_${Date.now()}`);
      localStorage.setItem("current_user", JSON.stringify(existingUser));

      setSuccess("Welcome back! Signing you in...");

      setTimeout(() => {
        onSuccess(existingUser);
        onClose();
        resetForm();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters)");
      setIsLoading(false);
      return;
    }

    try {
      // Create new user using adaptive API
      const result = await adaptiveApi.registerUser({
        email: `${formData.phone.replace(/[^0-9]/g, "")}@phone.local`, // Create unique email from phone
        password: `phone_auth_${formData.phone}`, // Generate password for phone auth
        name: formData.name.trim(),
        phone: formData.phone,
        userType: "customer",
      });

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const data = result.data;

      // Store authentication data
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("current_user", JSON.stringify(data.user));

      const modeText = result.isOffline ? " (Offline Mode)" : "";
      setSuccess(
        `Account created successfully! Welcome to HomeServices Pro!${modeText}`,
      );

      setTimeout(() => {
        onSuccess(data.user);
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Account creation failed");
    }

    setIsLoading(false);
  };

  const handleBack = () => {
    if (currentStep === "otp") {
      setCurrentStep("phone");
      setGeneratedOTP("");
    } else if (currentStep === "name") {
      setCurrentStep("otp");
    }
    setError("");
    setSuccess("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-blue-100 p-4 sm:p-6 lg:p-8 max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {currentStep !== "phone" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back
            </Button>
          )}
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex-1 text-center">
            {currentStep === "phone" && "Sign In with Phone"}
            {currentStep === "otp" && "Verify OTP"}
            {currentStep === "name" && "Complete Profile"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-lg sm:text-xl"
          >
            ×
          </Button>
        </div>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-2">
            📱 Phone Authentication
          </p>
          <p className="text-green-700 text-xs">
            Sign in with your phone number.{" "}
            {window.location.hostname !== "localhost"
              ? "Running in offline mode with local storage."
              : "New users will be registered automatically."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Phone Number Step */}
        {currentStep === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="pl-10 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="+1 234-567-8900 or +91 98765 43210"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your phone number to receive an OTP
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        )}

        {/* OTP Verification Step */}
        {currentStep === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center mb-4">
              <Shield className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">
                Enter the 6-digit OTP sent to
              </p>
              <p className="font-medium text-gray-900">{formData.phone}</p>
            </div>

            <div>
              <Label htmlFor="otp" className="text-gray-700 font-medium">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
                required
                maxLength={6}
                className="mt-2 text-center text-2xl font-bold rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="000000"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Demo OTP is displayed above for testing
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOTP}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Didn't receive OTP? Resend
              </button>
            </div>
          </form>
        )}

        {/* Name Collection Step (for new users) */}
        {currentStep === "name" && (
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="text-center mb-4">
              <User className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">
                Welcome! Please tell us your name to complete your profile.
              </p>
            </div>

            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="pl-10 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneAuth;
