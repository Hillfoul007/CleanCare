import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Phone,
  User,
  Star,
  X,
} from "lucide-react";
import { bookingHelpers } from "@/integrations/mongodb/client";

interface BookingHistoryProps {
  currentUser?: any;
}

const BookingHistory: React.FC<BookingHistoryProps> = ({ currentUser }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser?._id && !currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = currentUser._id || currentUser.id;
        const { data, error } = await bookingHelpers.getUserBookings(userId);

        if (error) {
          setError(error.message);
        } else {
          setBookings(data || []);
        }
      } catch (error: any) {
        setError(error.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [currentUser]);

  const cancelBooking = async (bookingId: string) => {
    setCancellingBooking(bookingId);
    try {
      // Update booking status to cancelled
      const { error } = await bookingHelpers.updateBookingStatus(
        bookingId,
        "cancelled",
      );

      if (error) {
        alert(`Failed to cancel booking: ${error.message}`);
        return;
      }

      // Update local state
      setBookings((prevBookings) =>
        prevBookings.map((booking: any) =>
          booking.id === bookingId || booking._id === bookingId
            ? { ...booking, status: "cancelled" }
            : booking,
        ),
      );

      alert("Booking cancelled successfully");
    } catch (error: any) {
      alert(`Failed to cancel booking: ${error.message}`);
    } finally {
      setCancellingBooking(null);
    }
  };

  const clearAllBookings = () => {
    if (
      confirm(
        "Are you sure you want to clear all booking history? This cannot be undone.",
      )
    ) {
      localStorage.removeItem("user_bookings");
      setBookings([]);
      alert("All booking history cleared successfully");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please Sign In
          </h2>
          <p className="text-gray-600">
            You need to be logged in to view your booking history.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Bookings
            </h1>
            <p className="text-gray-600">
              Track your service requests and history
            </p>
          </div>
          {bookings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllBookings}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Clear History
            </Button>
          )}
        </div>

        {bookings.length === 0 ? (
          <Card className="border border-blue-200 text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by booking your first service!
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                Browse Services
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="border border-blue-200 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-gray-900">
                      {booking.service_type}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {formatStatus(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service Details */}
                  {booking.services && booking.services.length > 1 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Services:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {booking.services.map((service, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {new Date(booking.scheduled_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {booking.scheduled_time}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{booking.address}</span>
                  </div>

                  {/* Provider Info */}
                  {booking.provider && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <User className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.provider.user?.full_name ||
                            "Service Provider"}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {booking.provider.rating || "New"} •{" "}
                            {booking.provider.completed_jobs || 0} jobs
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rider Info */}
                  {booking.rider && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <User className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.rider.user?.full_name || "Service Rider"}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {booking.rider.rating || "New"} •{" "}
                            {booking.rider.completed_deliveries || 0} deliveries
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  {booking.additional_details && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Additional Details:
                      </h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        {booking.additional_details}
                      </p>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        ${booking.total_price}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      Booked on{" "}
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4">
                    {booking.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Rate Service
                      </Button>
                    )}

                    {(booking.status === "pending" ||
                      booking.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelBooking(booking.id || booking._id)}
                        disabled={
                          cancellingBooking === (booking.id || booking._id)
                        }
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {cancellingBooking === (booking.id || booking._id)
                          ? "Cancelling..."
                          : "Cancel Booking"}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
