import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Phone, MessageSquare } from "lucide-react";

interface SimplePhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const SimplePhoneAuthModal: React.FC<SimplePhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentView, setCurrentView] = useState<"phone" | "otp" | "name">(
    "phone",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");

  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    // Simple validation for demo
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // For demo purposes, generate a simple OTP
      const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(mockOTP);
      setCurrentView("otp");

      // OTP sent - user will receive it through their method

      // In real app, you would call SMS service here
    } catch (error: any) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // For demo, accept any OTP or the generated one
      if (otp === generatedOTP || otp.length === 6) {
        // Check if user exists in backend
        const existingUser = await checkUserInMongoDB(phoneNumber);

        if (existingUser && existingUser.full_name) {
          // User exists, login directly
          await handleUserLogin(existingUser);
        } else {
          // New user, ask for name
          setCurrentView("name");
        }
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserInMongoDB = async (phone: string) => {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://auth-back-ula7.onrender.com/api";
      const response = await fetch(`${API_BASE_URL}/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          return data.exists ? data.user : null;
        } catch (jsonError) {
          console.error("Invalid JSON response:", text);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error checking user:", error);
      return null;
    }
  };

  const createUserInMongoDB = async (userData: any) => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
      const response = await fetch(`${apiBaseUrl}/auth/register-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (response.ok) {
          return { data: data.user, error: null };
        } else {
          return {
            data: null,
            error: { message: data.error || "Registration failed" },
          };
        }
      } catch (jsonError) {
        console.error("Invalid JSON response:", text);
        return {
          data: null,
          error: { message: "Server error - invalid response" },
        };
      }
    } catch (error: any) {
      console.error("Network error:", error);
      return { data: null, error: { message: "Network connection failed" } };
    }
  };

  const handleUserLogin = async (user: any) => {
    // Store user data properly
    const authToken = `phone_${user.phone}_${Date.now()}`;
    localStorage.setItem("auth_token", authToken);
    localStorage.setItem("current_user", JSON.stringify(user));

    console.log("User logged in:", user);

    // Call success callback
    onSuccess(user);
    onClose();
    resetForm();
  };

  const handleNameSubmit = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userData = {
        phone: phoneNumber,
        full_name: fullName.trim(),
        user_type: "customer",
        phone_verified: true,
      };

      const { data, error } = await createUserInMongoDB(userData);

      if (error) {
        setError(error.message);
      } else {
        await handleUserLogin(data);
      }
    } catch (error: any) {
      setError("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setOtp("");
    setFullName("");
    setError("");
    setCurrentView("phone");
    setGeneratedOTP("");
  };

  const handleBack = () => {
    if (currentView === "otp") {
      setCurrentView("phone");
      setOtp("");
    } else if (currentView === "name") {
      setCurrentView("otp");
      setFullName("");
    }
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {currentView !== "phone" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {currentView === "phone" && "Sign In with Phone"}
              {currentView === "otp" && "Verify OTP"}
              {currentView === "name" && "Complete Profile"}
            </h2>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Phone Input */}
        {currentView === "phone" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter any phone number for demo (e.g., +1234567890)
              </p>
            </div>

            <Button
              onClick={sendOTP}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </div>
        )}

        {/* OTP Verification */}
        {currentView === "otp" && (
          <div className="space-y-4">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                OTP sent to
                <br />
                <span className="font-medium">{phoneNumber}</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Check your phone for the OTP code
              </p>
            </div>

            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={verifyOTP}
              disabled={isLoading || otp.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setCurrentView("phone")}
              className="w-full"
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </div>
        )}

        {/* Name Input */}
        {currentView === "name" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <p className="text-sm text-gray-600">
                Phone verified successfully!
                <br />
                Please tell us your name to complete registration.
              </p>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleNameSubmit}
              disabled={isLoading || !fullName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePhoneAuthModal;
