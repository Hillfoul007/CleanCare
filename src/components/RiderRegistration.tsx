import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Truck,
  MapPin,
  Upload,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Camera,
} from "lucide-react";
import { authHelpers } from "@/integrations/mongodb/client";
import LocationManager from "./LocationManager";
import { useLocation } from "@/hooks/useLocation";
import { locationService, type Coordinates } from "@/services/locationService";

interface RiderRegistrationProps {
  onSuccess: (rider: any) => void;
  onBack: () => void;
}

interface RiderData {
  // Personal Information
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Professional Information
  vehicle_type: string;
  license_number: string;
  experience_years: number;
  service_radius_km: number;

  // Location Information
  base_location: string;
  base_coordinates: Coordinates | null;
  operating_areas: string[];

  // Documents
  driver_license: File | null;
  vehicle_registration: File | null;
  insurance_certificate: File | null;
  profile_photo: File | null;

  // Additional Information
  bio: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  availability_hours: {
    start: string;
    end: string;
  };
  preferred_services: string[];
}

const RiderRegistration: React.FC<RiderRegistrationProps> = ({
  onSuccess,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [riderData, setRiderData] = useState<RiderData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicle_type: "",
    license_number: "",
    experience_years: 0,
    service_radius_km: 5,
    base_location: "",
    base_coordinates: null,
    operating_areas: [],
    driver_license: null,
    vehicle_registration: null,
    insurance_certificate: null,
    profile_photo: null,
    bio: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    availability_hours: {
      start: "08:00",
      end: "20:00",
    },
    preferred_services: [],
  });

  const { currentLocation, currentAddress, saveLocation, favoriteLocations } =
    useLocation({
      autoGeocoding: true,
      saveToSupabase: true,
    });

  const vehicleTypes = [
    "Motorcycle",
    "Scooter",
    "Bicycle",
    "Car",
    "Van",
    "Truck",
    "Electric Vehicle",
    "On Foot",
  ];

  const serviceTypes = [
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
    "Grocery Delivery",
    "Document Delivery",
    "Equipment Transport",
  ];

  const validateStep = (step: number): boolean => {
    setError("");

    switch (step) {
      case 1: // Personal Information
        if (!riderData.full_name.trim()) {
          setError("Full name is required");
          return false;
        }
        if (!validateEmail(riderData.email)) {
          setError("Please enter a valid email address");
          return false;
        }
        if (!validatePhone(riderData.phone)) {
          setError("Please enter a valid phone number");
          return false;
        }
        if (!validatePassword(riderData.password)) {
          setError("Password must be at least 6 characters long");
          return false;
        }
        if (riderData.password !== riderData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        break;

      case 2: // Professional Information
        if (!riderData.vehicle_type) {
          setError("Please select a vehicle type");
          return false;
        }
        if (!riderData.license_number.trim()) {
          setError("License number is required");
          return false;
        }
        if (riderData.experience_years < 0) {
          setError("Experience years cannot be negative");
          return false;
        }
        if (
          riderData.service_radius_km < 1 ||
          riderData.service_radius_km > 50
        ) {
          setError("Service radius must be between 1 and 50 km");
          return false;
        }
        break;

      case 3: // Location Information
        if (!riderData.base_location) {
          setError("Base location is required");
          return false;
        }
        if (!riderData.base_coordinates) {
          setError("Please set your base location coordinates");
          return false;
        }
        if (riderData.preferred_services.length === 0) {
          setError("Please select at least one service type");
          return false;
        }
        break;

      case 4: // Documents
        if (!riderData.driver_license) {
          setError("Driver's license is required");
          return false;
        }
        if (!riderData.vehicle_registration) {
          setError("Vehicle registration is required");
          return false;
        }
        if (!riderData.profile_photo) {
          setError("Profile photo is required");
          return false;
        }
        break;
    }

    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleLocationChange = (address: string, coordinates?: Coordinates) => {
    setRiderData((prev) => ({
      ...prev,
      base_location: address,
      base_coordinates: coordinates || null,
    }));
  };

  const handleFileUpload = (field: keyof RiderData, file: File | null) => {
    setRiderData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const uploadFileToSupabase = async (
    file: File,
    path: string,
  ): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("rider-documents")
      .upload(filePath, file);

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("rider-documents").getPublicUrl(filePath);

    return publicUrl;
  };

  const submitRegistration = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);
    setError("");

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await authHelpers.signUp(
        riderData.email,
        riderData.password,
        riderData.full_name,
        riderData.phone,
        "rider",
      );

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // 2. Upload documents
      const documentUrls: Record<string, string> = {};

      if (riderData.driver_license) {
        documentUrls.driver_license = await uploadFileToSupabase(
          riderData.driver_license,
          `drivers-licenses/${authData.user.id}`,
        );
      }

      if (riderData.vehicle_registration) {
        documentUrls.vehicle_registration = await uploadFileToSupabase(
          riderData.vehicle_registration,
          `vehicle-registrations/${authData.user.id}`,
        );
      }

      if (riderData.insurance_certificate) {
        documentUrls.insurance_certificate = await uploadFileToSupabase(
          riderData.insurance_certificate,
          `insurance-certificates/${authData.user.id}`,
        );
      }

      if (riderData.profile_photo) {
        documentUrls.profile_photo = await uploadFileToSupabase(
          riderData.profile_photo,
          `profile-photos/${authData.user.id}`,
        );
      }

      // 3. Save base location
      if (riderData.base_coordinates) {
        await saveLocation({
          address: riderData.base_location,
          coordinates: riderData.base_coordinates,
          location_type: "work",
          name: "Base Location",
          is_favorite: true,
        });
      }

      // 4. Create rider profile
      const riderProfile = {
        user_id: authData.user.id,
        vehicle_type: riderData.vehicle_type,
        license_number: riderData.license_number,
        experience_years: riderData.experience_years,
        service_radius_km: riderData.service_radius_km,
        base_location: riderData.base_location,
        base_coordinates: riderData.base_coordinates
          ? JSON.parse(JSON.stringify(riderData.base_coordinates))
          : null,
        operating_areas: riderData.operating_areas,
        preferred_services: riderData.preferred_services,
        bio: riderData.bio,
        emergency_contact_name: riderData.emergency_contact_name,
        emergency_contact_phone: riderData.emergency_contact_phone,
        availability_hours: riderData.availability_hours,
        documents: documentUrls,
        status: "pending",
        is_online: false,
        rating: 0,
        completed_deliveries: 0,
      };

      const { data: rider, error: riderError } =
        await riderHelpers.createRider(riderProfile);

      if (riderError) {
        throw new Error(
          `Failed to create rider profile: ${riderError.message}`,
        );
      }

      // 5. Success
      onSuccess({
        ...authData.user,
        rider_profile: rider,
      });
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Personal Information
        </h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={riderData.full_name}
            onChange={(e) =>
              setRiderData((prev) => ({ ...prev, full_name: e.target.value }))
            }
            placeholder="Enter your full name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={riderData.email}
            onChange={(e) =>
              setRiderData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your email"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={riderData.phone}
            onChange={(e) =>
              setRiderData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+1 234-567-8900"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
          <Input
            id="emergency_contact_name"
            value={riderData.emergency_contact_name}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                emergency_contact_name: e.target.value,
              }))
            }
            placeholder="Emergency contact name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="emergency_contact_phone">
            Emergency Contact Phone
          </Label>
          <Input
            id="emergency_contact_phone"
            type="tel"
            value={riderData.emergency_contact_phone}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                emergency_contact_phone: e.target.value,
              }))
            }
            placeholder="Emergency contact phone"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <div className="relative mt-2">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={riderData.password}
            onChange={(e) =>
              setRiderData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Create a password (min. 6 characters)"
            className="pr-10"
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
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative mt-2">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={riderData.confirmPassword}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Confirm your password"
            className="pr-10"
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Truck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Professional Information
        </h2>
        <p className="text-gray-600">
          Tell us about your vehicle and experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="vehicle_type">Vehicle Type *</Label>
          <select
            id="vehicle_type"
            value={riderData.vehicle_type}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                vehicle_type: e.target.value,
              }))
            }
            className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select vehicle type</option>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="license_number">License Number *</Label>
          <Input
            id="license_number"
            value={riderData.license_number}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                license_number: e.target.value,
              }))
            }
            placeholder="Enter your license number"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="experience_years">Years of Experience</Label>
          <Input
            id="experience_years"
            type="number"
            min="0"
            max="50"
            value={riderData.experience_years}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                experience_years: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="0"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="service_radius_km">Service Radius (km) *</Label>
          <Input
            id="service_radius_km"
            type="number"
            min="1"
            max="50"
            value={riderData.service_radius_km}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                service_radius_km: parseInt(e.target.value) || 5,
              }))
            }
            placeholder="5"
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="availability_start">Available From</Label>
          <Input
            id="availability_start"
            type="time"
            value={riderData.availability_hours.start}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                availability_hours: {
                  ...prev.availability_hours,
                  start: e.target.value,
                },
              }))
            }
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="availability_end">Available Until</Label>
          <Input
            id="availability_end"
            type="time"
            value={riderData.availability_hours.end}
            onChange={(e) =>
              setRiderData((prev) => ({
                ...prev,
                availability_hours: {
                  ...prev.availability_hours,
                  end: e.target.value,
                },
              }))
            }
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={riderData.bio}
          onChange={(e) =>
            setRiderData((prev) => ({ ...prev, bio: e.target.value }))
          }
          placeholder="Tell us about yourself and your experience..."
          className="mt-2"
          rows={4}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Location & Services
        </h2>
        <p className="text-gray-600">
          Set your base location and preferred services
        </p>
      </div>

      <div>
        <Label>Base Location *</Label>
        <div className="mt-2">
          <LocationManager
            onLocationChange={handleLocationChange}
            enableSaveToSupabase={false}
            showFavorites={false}
            showHistory={false}
          />
        </div>
        {riderData.base_location && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {riderData.base_location}
            </p>
            {riderData.base_coordinates && (
              <p className="text-xs text-blue-600 mt-1">
                Coordinates: {riderData.base_coordinates.lat.toFixed(6)},{" "}
                {riderData.base_coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>Preferred Service Types *</Label>
        <p className="text-sm text-gray-600 mb-3">
          Select the services you want to provide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {serviceTypes.map((service) => (
            <label
              key={service}
              className={`p-3 border-2 rounded-xl text-sm cursor-pointer transition-all ${
                riderData.preferred_services.includes(service)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <input
                type="checkbox"
                checked={riderData.preferred_services.includes(service)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setRiderData((prev) => ({
                      ...prev,
                      preferred_services: [...prev.preferred_services, service],
                    }));
                  } else {
                    setRiderData((prev) => ({
                      ...prev,
                      preferred_services: prev.preferred_services.filter(
                        (s) => s !== service,
                      ),
                    }));
                  }
                }}
                className="sr-only"
              />
              {service}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selected: {riderData.preferred_services.length} services
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Documents & Verification
        </h2>
        <p className="text-gray-600">
          Upload required documents for verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="driver_license">Driver's License *</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handleFileUpload("driver_license", e.target.files?.[0] || null)
              }
              className="hidden"
              id="driver_license"
            />
            <label htmlFor="driver_license" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <span className="text-gray-600"> your driver's license</span>
            </label>
            {riderData.driver_license && (
              <p className="text-green-600 mt-2">
                ✓ {riderData.driver_license.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="vehicle_registration">Vehicle Registration *</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handleFileUpload(
                  "vehicle_registration",
                  e.target.files?.[0] || null,
                )
              }
              className="hidden"
              id="vehicle_registration"
            />
            <label htmlFor="vehicle_registration" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <span className="text-gray-600"> your vehicle registration</span>
            </label>
            {riderData.vehicle_registration && (
              <p className="text-green-600 mt-2">
                ✓ {riderData.vehicle_registration.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="insurance_certificate">Insurance Certificate</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handleFileUpload(
                  "insurance_certificate",
                  e.target.files?.[0] || null,
                )
              }
              className="hidden"
              id="insurance_certificate"
            />
            <label htmlFor="insurance_certificate" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <span className="text-gray-600"> your insurance certificate</span>
            </label>
            {riderData.insurance_certificate && (
              <p className="text-green-600 mt-2">
                ✓ {riderData.insurance_certificate.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="profile_photo">Profile Photo *</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleFileUpload("profile_photo", e.target.files?.[0] || null)
              }
              className="hidden"
              id="profile_photo"
            />
            <label htmlFor="profile_photo" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <span className="text-gray-600"> your profile photo</span>
            </label>
            {riderData.profile_photo && (
              <p className="text-green-600 mt-2">
                ✓ {riderData.profile_photo.name}
              </p>
            )}
          </div>
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
              • Once approved, you'll receive access to the rider dashboard
            </li>
            <li>• You can start receiving service requests immediately</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-6">
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
              Rider Registration
            </h1>
            <p className="text-gray-600">Step {currentStep} of 4</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
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

        {/* Form Card */}
        <Card className="border border-blue-200 shadow-xl">
          <CardContent className="p-8">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8">
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
                className={`${currentStep === 1 ? "invisible" : ""} border-gray-300 text-gray-700 hover:bg-gray-50`}
                disabled={isLoading}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  disabled={isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submitRegistration}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiderRegistration;
