import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import LocationDetector from "../components/LocationDetector";
import RiderAuthModal from "../components/RiderAuthModal";
import {
  bookingHelpers,
  riderHelpers,
  authHelpers,
} from "@/integrations/mongodb/client";

interface Booking {
  id: string;
  customer_id: string;
  service_type: string;
  services: string[];
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  total_price: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  customer?: {
    full_name: string;
    phone: string;
    email: string;
  };
  additional_details?: string;
  created_at: string;
  coordinates?: { lat: number; lng: number };
  rider_id?: string;
}

const RiderPortal = () => {
  const [riderLocation, setRiderLocation] = useState<string>("");
  const [locationCoordinates, setLocationCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean>(false);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "pending" | "active" | "completed"
  >("pending");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRider, setCurrentRider] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authStep, setAuthStep] = useState<"login" | "location" | "ready">(
    "login",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Demo mode: check localStorage
        const demoUser = JSON.parse(
          localStorage.getItem("currentDemoUser") || "null",
        );
        if (
          demoUser &&
          (demoUser.user_type === "rider" || demoUser.user_type === "provider")
        ) {
          setCurrentUser(demoUser);
          setAuthStep("location");
          setShowAuthModal(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, []);

  // Load bookings
  useEffect(() => {
    if (currentUser && authStep === "ready") {
      loadBookings();
    }
  }, [currentUser, authStep]);

  const loadBookings = async () => {
    try {
      setLoading(true);

      // Demo mode: Load from localStorage or use mock data
      const demoBookings: Booking[] = [
        {
          id: "demo-booking-1",
          customer_id: "customer-1",
          service_type: "cleaning",
          services: ["House Cleaning"],
          scheduled_date: new Date().toISOString().split("T")[0],
          scheduled_time: "10:00",
          address: "123 Demo Street, Demo City",
          total_price: 80,
          status: "pending",
          customer: {
            full_name: "John Doe",
            phone: "+1 (555) 123-4567",
            email: "john@example.com",
          },
          additional_details: "Please bring cleaning supplies",
          created_at: new Date().toISOString(),
          coordinates: { lat: 40.7128, lng: -74.006 },
        },
        {
          id: "demo-booking-2",
          customer_id: "customer-2",
          service_type: "furniture",
          services: ["Furniture Assembly"],
          scheduled_date: new Date().toISOString().split("T")[0],
          scheduled_time: "14:00",
          address: "456 Another St, Demo City",
          total_price: 120,
          status: "confirmed",
          customer: {
            full_name: "Jane Smith",
            phone: "+1 (555) 987-6543",
            email: "jane@example.com",
          },
          additional_details: "IKEA bookshelf assembly",
          created_at: new Date().toISOString(),
          coordinates: { lat: 40.7589, lng: -73.9851 },
          rider_id: currentUser?.id,
        },
      ];

      setPendingBookings(demoBookings.filter((b) => b.status === "pending"));
      setActiveBookings(
        demoBookings.filter(
          (b) =>
            ["confirmed", "in_progress"].includes(b.status) &&
            b.rider_id === currentUser?.id,
        ),
      );
      setCompletedBookings(
        demoBookings.filter(
          (b) => b.status === "completed" && b.rider_id === currentUser?.id,
        ),
      );
    } catch (error) {
      console.error("Error loading bookings:", error);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setAuthStep("location");
  };

  const handleLocationChange = (
    location: string,
    coordinates?: { lat: number; lng: number },
  ) => {
    setRiderLocation(location);
    setLocationCoordinates(coordinates || null);
  };

  const handleLogout = async () => {
    try {
      await authHelpers.signOut();
      localStorage.removeItem("currentDemoUser");
      setCurrentUser(null);
      setCurrentRider(null);
      setAuthStep("login");
      setShowAuthModal(true);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleAcceptingOrders = () => {
    setIsAcceptingOrders(!isAcceptingOrders);
    setIsOnline(!isAcceptingOrders);
  };

  const acceptBooking = async (bookingId: string) => {
    try {
      // Move booking from pending to active
      const booking = pendingBookings.find((b) => b.id === bookingId);
      if (booking) {
        const updatedBooking = {
          ...booking,
          status: "confirmed" as const,
          rider_id: currentUser?.id,
        };
        setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setActiveBookings((prev) => [...prev, updatedBooking]);
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
    }
  };

  const rejectBooking = async (bookingId: string) => {
    try {
      setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (error) {
      console.error("Error rejecting booking:", error);
    }
  };

  const startNavigation = (booking: Booking) => {
    if (booking.coordinates) {
      const url = `https://maps.google.com/maps?q=${booking.coordinates.lat},${booking.coordinates.lng}`;
      window.open(url, "_blank");
    } else {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(booking.address)}`;
      window.open(url, "_blank");
    }
  };

  const startService = async (bookingId: string) => {
    try {
      const booking = activeBookings.find((b) => b.id === bookingId);
      if (booking) {
        const updatedBooking = { ...booking, status: "in_progress" as const };
        setActiveBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
        );
      }
    } catch (error) {
      console.error("Error starting service:", error);
    }
  };

  const collectPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const completeJob = async () => {
    try {
      if (selectedBooking) {
        const updatedBooking = {
          ...selectedBooking,
          status: "completed" as const,
        };
        setActiveBookings((prev) =>
          prev.filter((b) => b.id !== selectedBooking.id),
        );
        setCompletedBookings((prev) => [...prev, updatedBooking]);
        setShowPaymentModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error("Error completing job:", error);
    }
  };

  const renderBookingCard = (booking: Booking) => {
    return (
      <Card key={booking.id} className="border border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge
              variant={
                booking.status === "pending"
                  ? "destructive"
                  : booking.status === "confirmed"
                    ? "default"
                    : booking.status === "in_progress"
                      ? "secondary"
                      : "outline"
              }
            >
              {booking.status.replace("_", " ").toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-500">
              {new Date(booking.created_at).toLocaleDateString()}
            </span>
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
            <span className="text-gray-700">{booking.address}</span>
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

          {booking.status === "pending" && (
            <div className="flex space-x-2 pt-3">
              <Button
                onClick={() => acceptBooking(booking.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                onClick={() => rejectBooking(booking.id)}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {booking.status === "confirmed" && (
            <div className="flex space-x-2 pt-3">
              <Button
                onClick={() => startNavigation(booking)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
              <Button
                onClick={() => startService(booking.id)}
                variant="outline"
                className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            </div>
          )}

          {booking.status === "in_progress" && (
            <Button
              onClick={() => collectPayment(booking)}
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-3"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Collect Payment & Complete
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Auth Modal Step
  if (showAuthModal || authStep === "login") {
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
                    Service Provider Dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RiderAuthModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
          defaultView="signin"
        />
      </div>
    );
  }

  // Location Step
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
                We need your location to show you nearby booking requests within
                5km range.
              </p>
            </CardHeader>
            <CardContent>
              <LocationDetector
                onLocationChange={handleLocationChange}
                showInTopBar={false}
              />

              {riderLocation && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => setAuthStep("ready")}
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
                {currentUser && (
                  <p className="text-blue-100 text-xs">
                    Welcome,{" "}
                    {currentUser.profile?.full_name || currentUser.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LocationDetector
                onLocationChange={handleLocationChange}
                showInTopBar={true}
                className="hidden md:flex"
              />
              <Button
                onClick={toggleAcceptingOrders}
                className={`${isAcceptingOrders ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"} text-white`}
              >
                {isAcceptingOrders ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Orders
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Accept Orders
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
        {/* Status Card */}
        <Card className="mb-6 border border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {pendingBookings.length}
                </div>
                <div className="text-gray-600">Pending Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {activeBookings.length}
                </div>
                <div className="text-gray-600">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedBookings.length}
                </div>
                <div className="text-gray-600">Completed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Message */}
        {!isAcceptingOrders && (
          <Card className="mb-6 border border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-800 text-center">
                ⏸️ You're currently not accepting new orders. Toggle the "Accept
                Orders" button to start receiving requests.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-blue-100 rounded-lg p-1">
            {(["pending", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  selectedTab === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-blue-700 hover:text-blue-800"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "pending" && pendingBookings.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {pendingBookings.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {loading && (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading bookings...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {selectedTab === "pending" &&
            pendingBookings.map((booking) => renderBookingCard(booking))}

          {selectedTab === "active" &&
            activeBookings.map((booking) => renderBookingCard(booking))}

          {selectedTab === "completed" &&
            completedBookings.map((booking) => renderBookingCard(booking))}

          {!loading &&
            !error &&
            ((selectedTab === "pending" && pendingBookings.length === 0) ||
              (selectedTab === "active" && activeBookings.length === 0) ||
              (selectedTab === "completed" &&
                completedBookings.length === 0)) && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    No {selectedTab} bookings found.
                  </p>
                  {selectedTab === "pending" && !isAcceptingOrders && (
                    <p className="text-sm text-gray-400 mt-2">
                      Enable "Accept Orders" to see new requests.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Collect Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${selectedBooking.total_price}
                </div>
                <p className="text-gray-600">Total Amount</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Customer:</strong>{" "}
                  {selectedBooking.customer?.full_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Service:</strong>{" "}
                  {selectedBooking.services.join(", ")}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong> {selectedBooking.address}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={completeJob}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RiderPortal;
