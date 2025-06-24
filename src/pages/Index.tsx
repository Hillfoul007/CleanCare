import React, { useState, useEffect } from "react";
import MobileServiceCategories from "../components/MobileServiceCategories";
import BookingFlow from "../components/BookingFlow";
import MobileBookingHistory from "../components/MobileBookingHistory";
import Reviews from "../components/Reviews";
import JoinAsPro from "./JoinAsPro.tsx";
import AccountMenu from "../components/AccountMenu";
import PhoneAuth from "../components/PhoneAuth";
import MongoStatusIndicator from "../components/MongoStatusIndicator";
import BackendErrorBanner from "../components/BackendErrorBanner";
import OfflineModeIndicator from "../components/OfflineModeIndicator";
import OfflineWelcomeMessage from "../components/OfflineWelcomeMessage";
import UserDebugInfo from "../components/UserDebugInfo";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  getCurrentUser,
  isLoggedIn as checkIsLoggedIn,
  clearAuthData,
} from "../integrations/mongodb/client";
import { adaptiveApi } from "../utils/adaptiveApiClient";
import { userValidation } from "../utils/userValidation";

const Index = () => {
  const [currentView, setCurrentView] = useState("categories");
  const [selectedService, setSelectedService] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [isMultipleServices, setIsMultipleServices] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBackendError, setShowBackendError] = useState(false);

  // MongoDB Auth session with user validation
  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuthState = () => {
      const hasToken = checkIsLoggedIn();

      if (hasToken) {
        const user = userValidation.getCurrentValidUser();

        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        } else {
          // Clear invalid user data
          console.log("Invalid user data found, clearing authentication");
          clearAuthData();
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };

    checkAuthState();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuthState();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Location + cart listener
  useEffect(() => {
    getUserLocation();

    const handleCartBooking = () => {
      const cart = JSON.parse(localStorage.getItem("service_cart") || "[]");
      if (cart.length > 0) {
        handleMultipleServicesSelect(cart);
      }
    };

    window.addEventListener("bookCartServices", handleCartBooking);
    return () =>
      window.removeEventListener("bookCartServices", handleCartBooking);
  }, []);

  // Real location detection
  const getUserLocation = async () => {
    // Set loading state initially
    setCurrentLocation("Detecting location...");

    if (!navigator.geolocation) {
      setCurrentLocation("Location not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocationCoordinates({ lat: latitude, lng: longitude });

          // Try backend geocoding first using adaptive API
          try {
            const result = await adaptiveApi.geocodeLocation(
              latitude,
              longitude,
            );

            if (result.data && result.data.address) {
              setCurrentLocation(result.data.address);
              return;
            } else if (result.isOffline) {
              console.log("Backend unavailable, using coordinate fallback");
              setCurrentLocation(
                `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              );
              return;
            }
          } catch (backendError) {
            console.log(
              "Backend geocoding failed, trying fallback:",
              backendError,
            );
          }

          // Fallback to OpenStreetMap if backend fails
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            );

            if (response.ok) {
              const data = await response.json();
              let displayLocation = "";

              if (data.address) {
                // Extract city/area information in priority order
                const city =
                  data.address.city ||
                  data.address.town ||
                  data.address.village;

                const locality =
                  data.address.suburb ||
                  data.address.neighbourhood ||
                  data.address.quarter ||
                  data.address.hamlet;

                const administrative =
                  data.address.county || data.address.state_district;

                const state = data.address.state;
                const country = data.address.country;

                // Build display location prioritizing city names
                if (city) {
                  displayLocation = city;
                  if (state && state !== city) {
                    displayLocation += `, ${state}`;
                  }
                } else if (locality) {
                  displayLocation = locality;
                  if (administrative && administrative !== locality) {
                    displayLocation += `, ${administrative}`;
                  } else if (state && state !== locality) {
                    displayLocation += `, ${state}`;
                  }
                } else if (administrative) {
                  displayLocation = administrative;
                  if (state && state !== administrative) {
                    displayLocation += `, ${state}`;
                  }
                } else if (state) {
                  displayLocation = state;
                  if (country && country !== state) {
                    displayLocation += `, ${country}`;
                  }
                }

                // Final fallback to first meaningful part of display_name
                if (!displayLocation && data.display_name) {
                  const parts = data.display_name.split(",");
                  // Skip house numbers and focus on area names
                  for (let part of parts) {
                    const cleanPart = part.trim();
                    if (
                      cleanPart &&
                      !cleanPart.match(/^\d+/) &&
                      cleanPart.length > 2
                    ) {
                      displayLocation = cleanPart;
                      break;
                    }
                  }
                }
              }

              // Only show coordinates as absolute last resort
              const finalLocation = displayLocation || "Location detected";
              setCurrentLocation(finalLocation);
            } else {
              setCurrentLocation("Location detected");
            }
          } catch (nominatimError) {
            console.log("Nominatim geocoding failed:", nominatimError);
            setCurrentLocation("Location detected");
          }
        } catch (err) {
          console.log("Location processing failed:", err);
          setCurrentLocation("Location detection failed");
        }
      },
      (err) => {
        console.log("Geolocation permission denied or failed:", err);
        setCurrentLocation("Location access denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      },
    );
  };

  const navigateBack = () => {
    if (["booking", "reviews", "history", "joinAsPro"].includes(currentView)) {
      setCurrentView("categories");
    }
  };

  const handleServiceSelect = (service) => {
    if (Array.isArray(service)) {
      setSelectedServices(service);
      setIsMultipleServices(true);
      setCurrentView("booking");
    } else {
      setSelectedService(service.name);
      setSelectedProvider(service);
      setIsMultipleServices(false);
      setCurrentView("booking");
    }
  };

  const handleMultipleServicesSelect = (services) => {
    setSelectedServices(services);
    setIsMultipleServices(true);
    setCurrentView("booking");
  };

  const handleBookingComplete = () => {
    setCurrentView("categories");
    setSelectedService("");
    setSelectedServices([]);
    setSelectedProvider(null);
    setIsMultipleServices(false);
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);

    // Force re-render by triggering auth state check
    setTimeout(() => {
      const hasToken = checkIsLoggedIn();
      const storedUser = getCurrentUser();

      if (hasToken && storedUser) {
        setCurrentUser(storedUser);
        setIsLoggedIn(true);
      }
    }, 100);
  };

  const handleLogout = () => {
    clearAuthData();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView("categories");
    setShowDropdown(false);
  };

  // Auto-close dropdown on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest(".profile-menu")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Location detection on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Backend Error Banner */}
      {showBackendError && (
        <BackendErrorBanner onDismiss={() => setShowBackendError(false)} />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 shadow-xl sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
            <div className="flex items-center gap-1 sm:gap-3">
              {currentView !== "categories" && (
                <button
                  onClick={navigateBack}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm sm:text-lg lg:text-xl">
                    H
                  </span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">
                    HomeServices Pro
                  </h1>
                  <p className="text-blue-200 text-xs">
                    Professional Services Platform
                  </p>
                </div>
                {/* Mobile title */}
                <div className="block sm:hidden">
                  <h1 className="text-sm font-bold text-white tracking-tight">
                    HomeServices
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              <div className="flex items-center gap-1 px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-md sm:rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300" />
                <span className="text-white font-medium text-xs sm:text-sm max-w-16 sm:max-w-24 lg:max-w-none truncate">
                  {currentLocation || "Detecting..."}
                </span>
              </div>

              {/* Status Indicators - Hidden on smallest screens */}
              <div className="hidden sm:flex items-center gap-1">
                <OfflineModeIndicator />
                <MongoStatusIndicator />
              </div>

              {/* Auth Buttons */}
              <AccountMenu
                isLoggedIn={isLoggedIn}
                userEmail={currentUser?.email || ""}
                currentUser={currentUser}
                onLogin={() => setShowAuthModal(true)}
                onLogout={handleLogout}
                onViewBookings={() => setCurrentView("history")}
                className="text-black bg-white hover:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-1 sm:py-4 lg:py-8">
        {currentView === "categories" && (
          <MobileServiceCategories
            onServiceSelect={handleServiceSelect}
            onMultipleServicesSelect={handleMultipleServicesSelect}
          />
        )}
        {currentView === "booking" && (
          <BookingFlow
            provider={selectedProvider}
            services={selectedServices}
            isMultipleServices={isMultipleServices}
            currentUser={currentUser}
            userLocation={currentLocation}
            locationCoordinates={locationCoordinates}
            onBookingComplete={handleBookingComplete}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {currentView === "history" && (
          <MobileBookingHistory currentUser={currentUser} />
        )}
        {currentView === "reviews" && <Reviews provider={selectedProvider} />}
        {currentView === "joinAsPro" && (
          <JoinAsPro
            onBack={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
        )}
      </main>

      {/* Phone Auth Modal */}
      <PhoneAuth
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Offline Welcome Message */}
      <OfflineWelcomeMessage />

      {/* Debug Info (development/auth issues only) */}
      <UserDebugInfo />
    </div>
  );
};

export default Index;
