import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Truck } from "lucide-react";
import { authHelpers } from "@/integrations/mongodb/client";

interface RiderAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultView?: "signin" | "signup" | "forgot-password";
}

const RiderAuthModal: React.FC<RiderAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultView = "signin",
}) => {
  const [currentView, setCurrentView] = useState<
    "signin" | "signup" | "forgot-password"
  >(defaultView);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    userType: "rider" as "rider",
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      userType: "rider",
    });
    setError("");
    setSuccess("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Support international phone numbers (Indian and international formats)
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Try backend API first
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://auth-back-ula7.onrender.com/api";
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Check if user is rider/provider
        if (
          data.user &&
          (data.user.user_type === "rider" ||
            data.user.user_type === "provider")
        ) {
          onSuccess(data.user);
          onClose();
          resetForm();
        } else {
          setError("Access denied. This login is for service providers only.");
        }
      } else {
        const errorData = await response.json();
        if (errorData.error.includes("does not exist")) {
          setError(
            "Database not configured. Please set up the database first.",
          );
        } else {
          setError(errorData.error || "Login failed");
        }
      }
    } catch (err: any) {
      // Fallback to Supabase
      try {
        const { data, error } = await authHelpers.signIn(
          formData.email,
          formData.password,
        );

        if (error) {
          if (error.message?.includes("does not exist")) {
            setError(
              "Database tables not found. Please run the database setup script.",
            );
          } else {
            setError(error.message);
          }
        } else if (data.user) {
          const { data: profile } = await authHelpers.getCurrentUserProfile();

          // Check if user is rider/provider
          if (
            profile &&
            (profile.user_type === "rider" || profile.user_type === "provider")
          ) {
            onSuccess({ ...data.user, profile });
            onClose();
            resetForm();
          } else {
            setError(
              "Access denied. This login is for service providers only.",
            );
            await authHelpers.signOut();
          }
        }
      } catch (fallbackErr: any) {
        setError("Database connection failed. Please check your setup.");
      }
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Full name is required");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await authHelpers.signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        formData.userType,
      );

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess(
          "Rider account created successfully! Please verify your email to continue.",
        );
        // Auto sign in after successful signup
        setTimeout(async () => {
          const { data: signInData } = await authHelpers.signIn(
            formData.email,
            formData.password,
          );
          if (signInData.user) {
            const { data: profile } = await authHelpers.getCurrentUserProfile();
            onSuccess({ ...signInData.user, profile });
            onClose();
            resetForm();
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Account creation failed");
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await authHelpers.resetPassword(formData.email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password reset email sent! Please check your inbox.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {currentView !== "signin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentView("signin");
                setError("");
                setSuccess("");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Rider Portal</h2>
            </div>
            <p className="text-sm text-gray-600">
              {currentView === "signin" && "Welcome back, service provider"}
              {currentView === "signup" && "Join as Service Provider"}
              {currentView === "forgot-password" && "Reset Password"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
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

        {/* Sign In Form */}
        {currentView === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="mt-2 rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="Enter your professional email"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="mt-2 rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Signing In..." : "Sign In to Dashboard"}
            </Button>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => setCurrentView("forgot-password")}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Forgot your password?
              </button>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-2">
                  New service provider?
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentView("signup")}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Create Rider Account
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Sign Up Form */}
        {currentView === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="mt-2 rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="mt-2 rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="Enter your professional email"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="mt-2 rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="+91 98765 43210 or +1 234-567-8900"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500 pr-10"
                  placeholder="Create a secure password (min. 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-gray-700 font-medium"
              >
                Confirm Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  className="rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                Service Provider Benefits:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>�� Accept bookings within 5km range</li>
                <li>• Real-time navigation to customers</li>
                <li>• Instant payment collection</li>
                <li>• Professional dashboard</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Creating Account..." : "Create Rider Account"}
            </Button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">Already have an account?</p>
              <button
                type="button"
                onClick={() => setCurrentView("signin")}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {currentView === "forgot-password" && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="mt-2 rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="Enter your professional email"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RiderAuthModal;
