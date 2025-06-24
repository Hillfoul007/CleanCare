import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  DollarSign,
  Phone,
  User,
  Navigation,
  Check,
  X,
  LogOut,
  CreditCard,
  Play,
  Pause,
  TrendingUp,
  AlertCircle,
  Settings,
  Star,
  Route,
  Zap,
} from "lucide-react";
import LocationManager from "../components/LocationManager";
import RiderRegistration from "../components/RiderRegistration";
import { useLocation } from "@/hooks/useLocation";
import { providerLocationService } from "@/services/providerLocationService";
import { locationService, type Coordinates } from "@/services/locationService";
import {
  authHelpers,
  riderHelpers,
  bookingHelpers,
} from "@/integrations/mongodb/client";

interface BookingWithLocation {
  id: string;
  customer_id: string;
  service_type: string;
  services: string[];
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  formatted_address?: string;
  coordinates?: { lat: number; lng: number };
  place_id?: string;
  total_price: number;
  distance_km?: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  customer?: {
    full_name: string;
    phone: string;
    email: string;
  };
  additional_details?: string;
  created_at: string;
  rider_id?: string;
}

interface RiderProfile {
  id: string;
  user_id: string;
  vehicle_type: string;
  license_number: string;
  service_radius_km: number;
  base_location?: string;
  base_coordinates?: Coordinates;
  current_coordinates?: Coordinates;
  preferred_services: string[];
  is_online: boolean;
  status: "pending" | "approved" | "suspended";
  rating: number;
  completed_deliveries: number;
  availability_hours: {
    start: string;
    end: string;
  };
  last_location_update?: string;
}

const EnhancedRiderPortal = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [authStep, setAuthStep] = useState<
    "login" | "register" | "location" | "ready"
  >("login");
  const [showRegistration, setShowRegistration] = useState(false);

  // Location State
  const [isOnline, setIsOnline] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Booking State
  const [pendingBookings, setPendingBookings] = useState<BookingWithLocation[]>(
    [],
  );
  const [activeBookings, setActiveBookings] = useState<BookingWithLocation[]>(
    [],
  );
  const [completedBookings, setCompletedBookings] = useState<
    BookingWithLocation[]
  >([]);
  const [selectedTab, setSelectedTab] = useState<
    "pending" | "active" | "completed" | "analytics"
  >("pending");

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithLocation | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Statistics
  const [dailyStats, setDailyStats] = useState({
    earnings: 0,
    trips: 0,
    distance: 0,
    hours: 0,
  });

  // Location Hook
  const {
    currentLocation,
    currentAddress,
    isDetecting,
    getCurrentLocation,
    saveLocation,
    stopWatching,
  } = useLocation({
    autoGeocoding: true,
    saveToSupabase: true,
    watchPosition: false,
  });

  // Authentication check on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Location watching effect
  useEffect(() => {
    if (isOnline && riderProfile) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isOnline, riderProfile]);

  // Bookings refresh effect
  useEffect(() => {
    if (riderProfile && authStep === "ready") {
      refreshBookings();
      const interval = setInterval(refreshBookings, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [riderProfile, authStep]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);

      // Check for Firebase authentication
      const firebaseUser = localStorage.getItem("firebase_user");
      const authToken = localStorage.getItem("auth_token");

      if (firebaseUser && authToken) {
        const user = JSON.parse(firebaseUser);

        // Check if user is a rider
        if (user.userType === "rider" || user.user_type === "rider") {
          setCurrentUser(user);

          // Fetch rider profile
          const { data: rider } = await riderHelpers.getRiderByUserId(
            user.uid || user._id,
          );
          if (rider) {
            setRiderProfile(rider);
            setAuthStep("ready");
          } else {
            setAuthStep("register");
          }
        } else {
          setAuthStep("register");
        }
      } else {
        // Check for demo user
        const demoUser = JSON.parse(
          localStorage.getItem("currentDemoUser") || "null",
        );
        if (
          demoUser &&
          (demoUser.user_type === "rider" || demoUser.user_type === "provider")
        ) {
          setCurrentUser(demoUser);
          setAuthStep("location");
        } else {
          setAuthStep("auth");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStep("auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = (user: any) => {
    setCurrentUser(user);
    setAuthStep("location");
  };

  const handleSuccessfulRegistration = (rider: any) => {
    setCurrentUser(rider);
    setRiderProfile(rider.rider_profile);
    setAuthStep("ready");
    setShowRegistration(false);
  };

  const handleLocationSetup = (address: string, coordinates?: Coordinates) => {
    if (coordinates && riderProfile) {
      // Update rider's current location
      updateRiderLocation(coordinates, address);
      setAuthStep("ready");
    }
  };

  const startLocationTracking = useCallback(() => {
    if (!riderProfile || locationUpdateInterval) return;

    const trackLocation = async () => {
      try {
        const coordinates = await getCurrentLocation();
        if (coordinates) {
          await updateRiderLocation(coordinates);
        }
      } catch (error) {
        console.error("Location tracking error:", error);
      }
    };

    // Initial location update
    trackLocation();

    // Set up regular location updates every 2 minutes
    const interval = setInterval(trackLocation, 120000);
    setLocationUpdateInterval(interval);
  }, [riderProfile, getCurrentLocation]);

  const stopLocationTracking = useCallback(() => {
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
    }
    stopWatching();
  }, [locationUpdateInterval, stopWatching]);

  const updateRiderLocation = async (
    coordinates: Coordinates,
    address?: string,
  ) => {
    if (!riderProfile) return;

    try {
      await providerLocationService.updateRiderLocation(riderProfile.id, {
        coordinates,
        address,
      });

      // Update local state
      setRiderProfile((prev) =>
        prev
          ? {
              ...prev,
              current_coordinates: coordinates,
              last_location_update: new Date().toISOString(),
            }
          : null,
      );
    } catch (error) {
      console.error("Error updating rider location:", error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!riderProfile) return;

    try {
      const newOnlineStatus = !isOnline;

      if (newOnlineStatus && !currentLocation) {
        setError("Please enable location to go online");
        return;
      }

      setLoading(true);

      await riderHelpers.updateRiderStatus(
        riderProfile.id,
        newOnlineStatus,
        currentAddress,
      );

      setIsOnline(newOnlineStatus);
      setIsAcceptingOrders(newOnlineStatus);

      if (newOnlineStatus) {
        startLocationTracking();
      } else {
        stopLocationTracking();
      }
    } catch (error) {
      console.error("Error toggling online status:", error);
      setError("Failed to update online status");
    } finally {
      setLoading(false);
    }
  };

  const refreshBookings = async () => {
    if (!riderProfile) return;

    try {
      // Get pending bookings near rider's location
      if (currentLocation) {
        const nearbyBookings = await providerLocationService.getBookingsInArea(
          currentLocation,
          riderProfile.service_radius_km,
          ["pending"],
        );
        setPendingBookings(nearbyBookings);
      }

      // Get rider's active and completed bookings
      const { data: riderBookings } = await riderHelpers.getRiderBookings(
        riderProfile.id,
      );
      if (riderBookings) {
        setActiveBookings(
          riderBookings.filter(
            (b) => b.status === "confirmed" || b.status === "in_progress",
          ),
        );
        setCompletedBookings(
          riderBookings.filter((b) => b.status === "completed"),
        );
      }

      // Calculate daily statistics
      calculateDailyStats(riderBookings || []);
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    }
  };

  const calculateDailyStats = (bookings: BookingWithLocation[]) => {
    const today = new Date().toDateString();
    const todayBookings = bookings.filter(
      (b) =>
        new Date(b.created_at).toDateString() === today &&
        b.status === "completed",
    );

    const stats = {
      earnings: todayBookings.reduce((sum, b) => sum + b.total_price, 0),
      trips: todayBookings.length,
      distance: todayBookings.reduce((sum, b) => sum + (b.distance_km || 0), 0),
      hours: todayBookings.length * 0.5, // Estimate 30 minutes per trip
    };

    setDailyStats(stats);
  };

  const acceptBooking = async (bookingId: string) => {
    if (!riderProfile) return;

    try {
      setLoading(true);
      const { data, error } = await bookingHelpers.acceptBooking(
        bookingId,
        riderProfile.id,
      );

      if (error) {
        setError(error.message || "Failed to accept booking");
        return;
      }

      // Move booking from pending to active
      const booking = pendingBookings.find((b) => b.id === bookingId);
      if (booking) {
        setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setActiveBookings((prev) => [
          ...prev,
          { ...booking, status: "confirmed", rider_id: riderProfile.id },
        ]);
      }

      // Show notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Booking Accepted!", {
          body: `You've accepted a ${booking?.service_type} booking`,
          icon: "/favicon.ico",
        });
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      setError("Failed to accept booking");
    } finally {
      setLoading(false);
    }
  };

  const startService = async (bookingId: string) => {
    try {
      await bookingHelpers.updateBookingStatus(bookingId, "in_progress");

      setActiveBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "in_progress" } : b,
        ),
      );
    } catch (error) {
      console.error("Error starting service:", error);
      setError("Failed to start service");
    }
  };

  const completeService = async (booking: BookingWithLocation) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentCollection = async () => {
    if (!selectedBooking) return;

    try {
      await bookingHelpers.updateBookingStatus(selectedBooking.id, "completed");

      // Move from active to completed
      setActiveBookings((prev) =>
        prev.filter((b) => b.id !== selectedBooking.id),
      );
      setCompletedBookings((prev) => [
        { ...selectedBooking, status: "completed" },
        ...prev,
      ]);

      setShowPaymentModal(false);
      setSelectedBooking(null);

      // Update daily stats
      refreshBookings();
    } catch (error) {
      console.error("Error completing service:", error);
      setError("Failed to complete service");
    }
  };

  const navigateToBooking = (booking: BookingWithLocation) => {
    if (navigator.geolocation && booking.coordinates) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = `${booking.coordinates!.lat},${booking.coordinates!.lng}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
          window.open(url, "_blank");
        },
        () => {
          // Fallback: just search for the address
          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`;
          window.open(url, "_blank");
        },
      );
    }
  };

  const handleLogout = async () => {
    try {
      // Clear Firebase/MongoDB auth
      await authHelpers.signOut();
      localStorage.removeItem("currentDemoUser");

      setCurrentUser(null);
      setRiderProfile(null);
      setAuthStep("login");
      setIsOnline(false);
      setIsAcceptingOrders(false);
      stopLocationTracking();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderBookingCard = (
    booking: BookingWithLocation,
    actionType: "accept" | "navigate" | "complete",
  ) => (
    <Card
      key={booking.id}
      className="mb-4 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow"
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-gray-900">
            {booking.service_type}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                booking.status === "pending"
                  ? "secondary"
                  : booking.status === "completed"
                    ? "default"
                    : "destructive"
              }
              className={
                booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : booking.status === "confirmed"
                    ? "bg-blue-100 text-blue-800"
                    : booking.status === "in_progress"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-green-100 text-green-800"
              }
            >
              {booking.status.replace("_", " ")}
            </Badge>
            {booking.distance_km && (
              <Badge variant="outline" className="text-xs">
                {booking.distance_km.toFixed(1)} km
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {booking.customer && (
          <>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {booking.customer.full_name || "Customer"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {booking.customer.phone || "N/A"}
              </span>
            </div>
          </>
        )}

        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">
            {booking.formatted_address || booking.address}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">
            {new Date(booking.scheduled_date).toLocaleDateString()} •{" "}
            {booking.scheduled_time}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-green-600 font-semibold">
            ${booking.total_price}
          </span>
        </div>

        {booking.services && booking.services.length > 1 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Services:</h4>
            <div className="flex flex-wrap gap-1">
              {booking.services.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {booking.additional_details && (
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Details:</h4>
            <p className="text-sm text-gray-600">
              {booking.additional_details}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-3">
          {actionType === "accept" && (
            <>
              <Button
                onClick={() => acceptBooking(booking.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {actionType === "navigate" && (
            <>
              <Button
                onClick={() => navigateToBooking(booking)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
              {booking.status === "confirmed" && (
                <Button
                  onClick={() => startService(booking.id)}
                  variant="outline"
                  className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
            </>
          )}

          {actionType === "complete" && booking.status === "in_progress" && (
            <Button
              onClick={() => completeService(booking)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Collect Payment & Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render different screens based on auth step
  if (loading && authStep === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (authStep === "login" || authStep === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <div className="bg-gradient-to-br from-green-600 via-blue-600 to-indigo-700 shadow-2xl">
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">R</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Rider Portal
                  </h1>
                  <p className="text-blue-100 text-sm">
                    Professional Service Dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showRegistration ? (
          <RiderRegistration
            onSuccess={handleSuccessfulRegistration}
            onBack={() => setShowRegistration(false)}
          />
        ) : (
          <div className="max-w-md mx-auto p-6">
            <Card className="border border-green-200 shadow-xl">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Join as Service Provider
                </h2>
                <p className="text-gray-600 mb-6">
                  Start earning by providing services in your area
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowRegistration(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  >
                    Register as Rider
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setAuthStep("login")}
                  >
                    Already have an account? Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (authStep === "location") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <div className="bg-gradient-to-br from-green-600 via-blue-600 to-indigo-700 shadow-2xl">
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">R</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Rider Portal
                  </h1>
                  <p className="text-blue-100 text-sm">Set Your Location</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <Card className="border border-blue-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                📍 Set Your Location
              </CardTitle>
              <p className="text-center text-gray-600">
                We need your location to show you nearby service requests
              </p>
            </CardHeader>
            <CardContent>
              <LocationManager
                onLocationChange={handleLocationSetup}
                enableSaveToSupabase={true}
                showFavorites={false}
                showHistory={false}
              />
              {currentAddress && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() =>
                      handleLocationSetup(currentAddress, currentLocation!)
                    }
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3"
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-indigo-700 shadow-2xl">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Rider Portal</h1>
                <p className="text-blue-100 text-sm">
                  Service Provider Dashboard
                </p>
                {currentUser?.profile?.full_name && (
                  <p className="text-blue-100 text-xs">
                    Welcome, {currentUser.profile.full_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LocationManager
                onLocationChange={(address, coordinates) => {
                  if (coordinates) updateRiderLocation(coordinates, address);
                }}
                showInTopBar={true}
                className="hidden md:flex"
              />

              <Button
                onClick={toggleOnlineStatus}
                className={`${
                  isOnline
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white`}
                disabled={loading}
              >
                {isOnline ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Go Offline
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Go Online
                  </>
                )}
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Today's Earnings</p>
                <p className="text-xl font-bold text-green-600">
                  ${dailyStats.earnings}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Trips Completed</p>
                <p className="text-xl font-bold text-blue-600">
                  {dailyStats.trips}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Distance (km)</p>
                <p className="text-xl font-bold text-purple-600">
                  {dailyStats.distance.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Hours Online</p>
                <p className="text-xl font-bold text-orange-600">
                  {dailyStats.hours.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Alert */}
        {!isOnline && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <p className="text-orange-800">
                  You're offline. Go online to start receiving service requests.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError("")}
                  className="text-red-600 hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={(value: any) => setSelectedTab(value)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingBookings.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="p-8 text-center text-gray-500">
                  {!isOnline ? (
                    <>
                      <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p>Go online to receive service requests</p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p>No pending requests in your area</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div>
                {pendingBookings.map((booking) =>
                  renderBookingCard(booking, "accept"),
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {activeBookings.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="p-8 text-center text-gray-500">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>No active jobs at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {activeBookings.map((booking) =>
                  renderBookingCard(booking, "navigate"),
                )}
                {activeBookings
                  .filter((b) => b.status === "in_progress")
                  .map((booking) => renderBookingCard(booking, "complete"))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedBookings.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="p-8 text-center text-gray-500">
                  <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>No completed jobs yet</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {completedBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="mb-4 border border-green-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {booking.service_type}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.formatted_address || booking.address}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${booking.total_price}
                          </p>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Rating</span>
                      <span className="font-bold">
                        {riderProfile?.rating.toFixed(1)} ⭐
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Completed</span>
                      <span className="font-bold">
                        {riderProfile?.completed_deliveries}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Radius</span>
                      <span className="font-bold">
                        {riderProfile?.service_radius_km} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge
                        variant={
                          riderProfile?.status === "approved"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {riderProfile?.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="font-medium">
                        {currentAddress || "Location not set"}
                      </p>
                    </div>
                    {riderProfile?.base_location && (
                      <div>
                        <p className="text-sm text-gray-600">Base Location</p>
                        <p className="font-medium">
                          {riderProfile.base_location}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Last Update</p>
                      <p className="font-medium">
                        {riderProfile?.last_location_update
                          ? new Date(
                              riderProfile.last_location_update,
                            ).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center space-x-2">
                <CreditCard className="w-6 h-6 text-green-600" />
                <span>Collect Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-lg font-semibold">Service Completed!</p>
                <p className="text-gray-600">Collect payment from customer</p>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${selectedBooking.total_price}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Customer: {selectedBooking.customer?.full_name}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handlePaymentCollection}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Payment Collected - Complete Job
                  </Button>
                  <Button
                    onClick={() => setShowPaymentModal(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedRiderPortal;
