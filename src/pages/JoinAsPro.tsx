import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCog,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  Clock,
  CheckCircle,
  Upload,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JoinAsProProps {
  onBack: () => void;
}

const JoinAsPro: React.FC<JoinAsProProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    experience: "",

    // Professional Information
    services: [] as string[],
    hourlyRate: "",
    availability: "",
    bio: "",
    certifications: "",

    // Verification
    idDocument: null as File | null,
    businessLicense: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableServices = [
    "House Cleaning",
    "Furniture Assembly",
    "Home Repair",
    "Moving & Packing",
    "Laundry Service",
    "Electrical Work",
    "Plumbing",
    "Painting",
    "Gardening",
    "Car Wash",
    "Pet Care",
    "Tutoring",
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim())
        newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
    }

    if (step === 2) {
      if (formData.services.length === 0)
        newErrors.services = "Select at least one service";
      if (!formData.hourlyRate.trim())
        newErrors.hourlyRate = "Hourly rate is required";
      if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailPhoneExists = async (
    email: string,
    phone: string,
  ): Promise<boolean> => {
    try {
      // This would check your Supabase database for existing users
      // For now, simulating the check
      const existingUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]",
      );
      return existingUsers.some(
        (user: any) => user.email === email || user.phone === phone,
      );
    } catch (error) {
      console.error("Error checking existing users:", error);
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      // Check if email or phone already exists
      const exists = await checkEmailPhoneExists(
        formData.email,
        formData.phone,
      );
      if (exists) {
        setErrors({
          email: "Email already registered",
          phone: "Phone number already registered",
        });
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleFileUpload = (
    field: "idDocument" | "businessLicense",
    file: File | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);

    try {
      // Simulate registration process
      const newProvider = {
        id: Date.now().toString(),
        ...formData,
        registeredAt: new Date().toISOString(),
        status: "pending",
        rating: 0,
        completedJobs: 0,
      };

      // Save to localStorage (in real app, this would go to Supabase)
      const existingProviders = JSON.parse(
        localStorage.getItem("registeredProviders") || "[]",
      );
      existingProviders.push(newProvider);
      localStorage.setItem(
        "registeredProviders",
        JSON.stringify(existingProviders),
      );

      // Add to registered users list
      const existingUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]",
      );
      existingUsers.push({
        email: formData.email,
        phone: formData.phone,
        type: "provider",
      });
      localStorage.setItem("registeredUsers", JSON.stringify(existingUsers));

      alert(
        "Registration successful! Your application is under review. You will be notified within 24-48 hours.",
      );
      onBack();
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <UserCog className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Personal Information
        </h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName" className="text-gray-700 font-medium">
            Full Name *
          </Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className={`mt-2 ${errors.fullName ? "border-red-500" : ""}`}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-700 font-medium">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className={`mt-2 ${errors.email ? "border-red-500" : ""}`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-gray-700 font-medium">
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            className={`mt-2 ${errors.phone ? "border-red-500" : ""}`}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city" className="text-gray-700 font-medium">
            City
          </Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            className="mt-2"
            placeholder="Enter your city"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-gray-700 font-medium">
          Full Address *
        </Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, address: e.target.value }))
          }
          className={`mt-2 ${errors.address ? "border-red-500" : ""}`}
          placeholder="Enter your complete address"
          rows={3}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>

      <div>
        <Label htmlFor="experience" className="text-gray-700 font-medium">
          Years of Experience
        </Label>
        <Input
          id="experience"
          type="number"
          value={formData.experience}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, experience: e.target.value }))
          }
          className="mt-2"
          placeholder="e.g., 3"
          min="0"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Star className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Professional Details
        </h2>
        <p className="text-gray-600">Set up your service profile</p>
      </div>

      <div>
        <Label className="text-gray-700 font-medium">
          Services You Offer *
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {availableServices.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => handleServiceToggle(service)}
              className={`p-3 border-2 rounded-xl text-sm transition-all ${
                formData.services.includes(service)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {service}
            </button>
          ))}
        </div>
        {errors.services && (
          <p className="text-red-500 text-sm mt-1">{errors.services}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="hourlyRate" className="text-gray-700 font-medium">
            Hourly Rate (USD) *
          </Label>
          <div className="relative mt-2">
            <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              id="hourlyRate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))
              }
              className={`pl-10 ${errors.hourlyRate ? "border-red-500" : ""}`}
              placeholder="25"
              min="1"
            />
          </div>
          {errors.hourlyRate && (
            <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="availability" className="text-gray-700 font-medium">
            Availability
          </Label>
          <Input
            id="availability"
            type="text"
            value={formData.availability}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, availability: e.target.value }))
            }
            className="mt-2"
            placeholder="Mon-Fri 9AM-6PM"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio" className="text-gray-700 font-medium">
          Professional Bio *
        </Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bio: e.target.value }))
          }
          className={`mt-2 ${errors.bio ? "border-red-500" : ""}`}
          placeholder="Tell customers about your experience, expertise, and what makes you special..."
          rows={4}
        />
        {errors.bio && (
          <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
        )}
      </div>

      <div>
        <Label htmlFor="certifications" className="text-gray-700 font-medium">
          Certifications & Qualifications
        </Label>
        <Textarea
          id="certifications"
          value={formData.certifications}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, certifications: e.target.value }))
          }
          className="mt-2"
          placeholder="List any relevant certifications, licenses, or qualifications..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Verification</h2>
        <p className="text-gray-600">Upload documents for verification</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-gray-700 font-medium">
            Government ID Document
          </Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handleFileUpload("idDocument", e.target.files?.[0] || null)
              }
              className="hidden"
              id="idDocument"
            />
            <label htmlFor="idDocument" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <span className="text-gray-600"> your ID document</span>
            </label>
            {formData.idDocument && (
              <p className="text-green-600 mt-2">
                ✓ {formData.idDocument.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-gray-700 font-medium">
            Business License (Optional)
          </Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handleFileUpload("businessLicense", e.target.files?.[0] || null)
              }
              className="hidden"
              id="businessLicense"
            />
            <label htmlFor="businessLicense" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <span className="text-gray-600"> your business license</span>
            </label>
            {formData.businessLicense && (
              <p className="text-green-600 mt-2">
                ✓ {formData.businessLicense.name}
              </p>
            )}
          </div>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Your application will be reviewed within 24-48 hours</li>
              <li>• We'll verify your documents and contact information</li>
              <li>
                • Once approved, you'll receive access to the provider dashboard
              </li>
              <li>• You can start receiving booking requests immediately</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="mr-4 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Join as Professional
            </h1>
            <p className="text-gray-600">Step {currentStep} of 3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="border border-blue-200 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8">
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                  className={`${currentStep === 1 ? "invisible" : ""} border-gray-300 text-gray-700 hover:bg-gray-50`}
                >
                  Previous
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinAsPro;
