import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
} from "lucide-react";

interface DemoSignInProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultView?: "signin" | "signup";
}

const DemoSignIn: React.FC<DemoSignInProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultView = "signin",
}) => {
  const [currentView, setCurrentView] = useState<"signin" | "signup">(
    defaultView,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
    });
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  // Demo users for testing
  const demoUsers = [
    {
      email: "demo@user.com",
      password: "demo123",
      name: "Demo User",
      phone: "+1234567890",
      id: "demo-user-1",
    },
    {
      email: "test@test.com",
      password: "test123",
      name: "Test User",
      phone: "+1987654321",
      id: "demo-user-2",
    },
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      // Check demo users
      const user = demoUsers.find(
        (u) => u.email === formData.email && u.password === formData.password,
      );

      if (user) {
        // Demo success
        const demoUser = {
          ...user,
          email: user.email,
          full_name: user.name,
        };

        // Store in localStorage for demo purposes
        localStorage.setItem("demo_auth_token", "demo-token-123");
        localStorage.setItem("current_user", JSON.stringify(demoUser));

        setSuccess("Welcome back! Signing you in...");

        setTimeout(() => {
          onSuccess(demoUser);
          onClose();
          resetForm();
        }, 1000);
      } else {
        setError(
          "Invalid email or password. Try demo@user.com / demo123 or test@test.com / test123",
        );
      }

      setIsLoading(false);
    }, 1500);
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

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      // Check if demo email already exists
      const existingUser = demoUsers.find((u) => u.email === formData.email);

      if (existingUser) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
        setIsLoading(false);
        return;
      }

      // Demo success - create new user
      const newUser = {
        id: `demo-user-${Date.now()}`,
        email: formData.email,
        name: formData.name,
        full_name: formData.name,
        phone: formData.phone,
      };

      // Store in localStorage for demo purposes
      localStorage.setItem("demo_auth_token", "demo-token-123");
      localStorage.setItem("current_user", JSON.stringify(newUser));

      setSuccess("Account created successfully! Welcome to HomeServices Pro!");

      setTimeout(() => {
        onSuccess(newUser);
        onClose();
        resetForm();
      }, 1500);

      setIsLoading(false);
    }, 1500);
  };

  const handleQuickDemo = () => {
    setFormData({
      ...formData,
      email: "demo@user.com",
      password: "demo123",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
          <h2 className="text-2xl font-bold text-gray-900 flex-1 text-center">
            {currentView === "signin" ? "Demo Sign In" : "Demo Sign Up"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium mb-2">
            🎯 Demo Mode Active
          </p>
          <p className="text-blue-700 text-xs mb-2">
            This is a demonstration without real authentication. Try these demo
            accounts:
          </p>
          <div className="space-y-1 text-xs text-blue-600">
            <div>📧 demo@user.com / demo123</div>
            <div>📧 test@test.com / test123</div>
          </div>
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
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="pl-10 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your email address"
                />
              </div>
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
                  className="rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
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

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <Button
                type="button"
                onClick={handleQuickDemo}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
              >
                🚀 Quick Demo Login
              </Button>
            </div>

            <div className="text-center space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Don't have an account?</p>
                <button
                  type="button"
                  onClick={() => setCurrentView("signup")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create Demo Account
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-2">Service provider?</p>
                <Button
                  type="button"
                  onClick={() => {
                    window.open("/join-as-pro", "_blank");
                    onClose();
                  }}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl"
                >
                  Demo Pro Login
                </Button>
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

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="pl-10 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

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
                  placeholder="+1 234-567-8900"
                />
              </div>
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
                  className="rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  placeholder="Create a password (min. 6 characters)"
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
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                className="mt-2 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? "Creating Account..." : "Create Demo Account"}
            </Button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">Already have an account?</p>
              <button
                type="button"
                onClick={() => setCurrentView("signin")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DemoSignIn;
